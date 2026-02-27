"""
Shopping recommendation hybrid engine:
- Association (FP-Growth rules)
- Replenishment (repeat timing)
- Collaborative filtering (user-based KNN)
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd
from mlxtend.frequent_patterns import association_rules, fpgrowth
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent / "models_saved" / "shopping_hybrid"

_rules_df = pd.DataFrame()
_purchases_df = pd.DataFrame()
_loaded = False


def _normalize_key(text: str) -> str:
    text = str(text or "").strip().lower()
    return " ".join(text.split())


def _to_utc_now() -> pd.Timestamp:
    ts = pd.Timestamp.utcnow()
    return ts.tz_localize("UTC") if ts.tzinfo is None else ts


def ensure_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    required_min = {"user_id", "list_id", "item_name", "is_checked"}
    missing = required_min - set(out.columns)
    if missing:
        raise ValueError(f"Missing required shopping columns: {missing}")

    if "product_key" not in out.columns:
        out["product_key"] = out["item_name"].map(_normalize_key)
    else:
        out["product_key"] = out["product_key"].fillna(out["item_name"].map(_normalize_key)).map(_normalize_key)

    if "category" not in out.columns:
        out["category"] = "GENEL"
    out["category"] = out["category"].fillna("GENEL").astype(str)

    if "added_at" not in out.columns:
        out["added_at"] = out.get("list_created_at")
    if "checked_at" not in out.columns:
        out["checked_at"] = out.get("added_at")
    if "list_created_at" not in out.columns:
        out["list_created_at"] = _to_utc_now()

    out["is_checked"] = out["is_checked"].astype(str).str.lower().isin(["1", "true", "t", "yes"])
    out["added_at"] = pd.to_datetime(out["added_at"], errors="coerce", utc=True)
    out["checked_at"] = pd.to_datetime(out["checked_at"], errors="coerce", utc=True)
    out["list_created_at"] = pd.to_datetime(out["list_created_at"], errors="coerce", utc=True)

    now_utc = _to_utc_now()
    out["list_created_at"] = out["list_created_at"].fillna(now_utc)
    out["added_at"] = out["added_at"].fillna(out["list_created_at"])
    out["checked_at"] = out["checked_at"].fillna(out["added_at"])
    return out


def train_and_save_artifacts(df: pd.DataFrame) -> None:
    global _rules_df, _purchases_df, _loaded

    normalized = ensure_columns(df)
    purchases = normalized[normalized["is_checked"]].copy()
    purchases = purchases[purchases["product_key"].str.len() > 0].copy()
    if purchases.empty:
        raise ValueError("No checked purchases found for training.")

    basket = purchases.groupby(["list_id", "product_key"]).size().unstack(fill_value=0)
    basket = (basket > 0).astype(bool)
    freq = fpgrowth(basket, min_support=0.002, use_colnames=True)
    if freq.empty:
        rules = pd.DataFrame(columns=["antecedents", "consequents", "confidence", "lift", "support"])
    else:
        rules = association_rules(freq, metric="confidence", min_threshold=0.05)
        rules = rules.sort_values(["lift", "confidence", "support"], ascending=False)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    rules.to_parquet(MODEL_DIR / "association_rules.parquet", index=False)
    purchases.to_parquet(MODEL_DIR / "purchases.parquet", index=False)

    _rules_df = rules
    _purchases_df = purchases
    _loaded = True
    logger.info("Shopping recommender artifacts saved at %s", MODEL_DIR)


def _load_artifacts() -> bool:
    global _rules_df, _purchases_df, _loaded
    try:
        rules_path = MODEL_DIR / "association_rules.parquet"
        purchases_path = MODEL_DIR / "purchases.parquet"
        if not rules_path.exists() or not purchases_path.exists():
            logger.info("Shopping artifacts not found in %s", MODEL_DIR)
            _loaded = False
            return False
        _rules_df = pd.read_parquet(rules_path)
        _purchases_df = pd.read_parquet(purchases_path)
        _loaded = True
        logger.info("Shopping recommender artifacts loaded.")
        return True
    except Exception as exc:
        logger.error("Shopping artifacts load failed: %s", exc)
        _loaded = False
        return False


def is_model_loaded() -> bool:
    return _loaded


def reload_model() -> bool:
    return _load_artifacts()


def _latest_basket_for_user(user_id: str) -> set[str]:
    u = _purchases_df[_purchases_df["user_id"].astype(str) == str(user_id)].copy()
    if u.empty:
        return set()
    latest_list = u.sort_values("checked_at").iloc[-1]["list_id"]
    return set(u[u["list_id"] == latest_list]["product_key"].unique().tolist())


def _association_scores(seed_items: set[str]) -> pd.DataFrame:
    if _rules_df.empty or not seed_items:
        return pd.DataFrame(columns=["product_key", "assoc"])

    scores: dict[str, float] = {}
    for _, r in _rules_df.iterrows():
        ant = set(r["antecedents"]) if not isinstance(r["antecedents"], set) else r["antecedents"]
        con = set(r["consequents"]) if not isinstance(r["consequents"], set) else r["consequents"]
        overlap = len(seed_items & ant)
        if overlap == 0:
            continue
        strength = float(r.get("lift", 0)) * float(r.get("confidence", 0)) * overlap / max(len(ant), 1)
        for item in con:
            if item in seed_items:
                continue
            scores[item] = max(scores.get(item, 0.0), strength)

    if not scores:
        return pd.DataFrame(columns=["product_key", "assoc"])
    return pd.DataFrame({"product_key": list(scores.keys()), "assoc": list(scores.values())})


def _replenishment_scores(user_id: str) -> pd.DataFrame:
    u = _purchases_df[_purchases_df["user_id"].astype(str) == str(user_id)].copy()
    if u.empty:
        return pd.DataFrame(columns=["product_key", "repl"])

    rows: list[tuple[str, float]] = []
    now = _to_utc_now()
    for product_key, g in u.groupby("product_key"):
        ts = g["checked_at"].dropna().drop_duplicates().sort_values()
        if len(ts) < 2:
            continue
        gaps = ts.diff().dropna().dt.days.values
        median_gap = max(float(np.median(gaps)), 1.0)
        days_since = max(float((now - ts.iloc[-1]).days), 0.0)
        rows.append((product_key, days_since / median_gap))

    if not rows:
        return pd.DataFrame(columns=["product_key", "repl"])
    out = pd.DataFrame(rows, columns=["product_key", "repl"])
    return out[out["repl"] >= 0.8]


def _cf_scores(user_id: str, k_neighbors: int = 30) -> pd.DataFrame:
    ui = _purchases_df.groupby(["user_id", "product_key"]).size().reset_index(name="cnt")
    if ui.empty:
        return pd.DataFrame(columns=["product_key", "cf"])

    user_ids = ui["user_id"].astype(str).unique().tolist()
    item_ids = ui["product_key"].astype(str).unique().tolist()
    user2idx = {u: i for i, u in enumerate(user_ids)}
    item2idx = {it: i for i, it in enumerate(item_ids)}
    if str(user_id) not in user2idx:
        return pd.DataFrame(columns=["product_key", "cf"])

    rows = ui["user_id"].astype(str).map(user2idx).values
    cols = ui["product_key"].astype(str).map(item2idx).values
    vals = ui["cnt"].astype(float).values
    mat = csr_matrix((vals, (rows, cols)), shape=(len(user_ids), len(item_ids)))

    uidx = user2idx[str(user_id)]
    n_neighbors = min(k_neighbors + 1, mat.shape[0])
    if n_neighbors <= 1:
        return pd.DataFrame(columns=["product_key", "cf"])

    knn = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=n_neighbors)
    knn.fit(mat)
    dists, nbrs = knn.kneighbors(mat[uidx], return_distance=True)

    nbr_idxs = nbrs[0][1:]
    sims = 1.0 - dists[0][1:]
    profile = mat[nbr_idxs].multiply(sims.reshape(-1, 1)).sum(axis=0)
    profile = np.asarray(profile).ravel()
    owned = set(mat[uidx].indices.tolist())
    if owned:
        profile[list(owned)] = 0.0

    idx2item = {v: k for k, v in item2idx.items()}
    recs = [{"product_key": idx2item[i], "cf": float(profile[i])} for i in np.where(profile > 0)[0]]
    return pd.DataFrame(recs)


def _normalize(df: pd.DataFrame, col: str, out_col: str) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["product_key", out_col])
    scaler = MinMaxScaler()
    vals = df[[col]].astype(float).values
    if np.allclose(vals.max(), vals.min()):
        df[out_col] = 1.0
    else:
        df[out_col] = scaler.fit_transform(vals)
    return df[["product_key", out_col]]


def recommend_for_user(
    user_id: str,
    top_k: int = 20,
    w_assoc: float = 0.45,
    w_repl: float = 0.35,
    w_cf: float = 0.20,
) -> list[dict]:
    if not _loaded or _purchases_df.empty:
        raise ValueError("Shopping recommender model is not loaded.")

    seed_items = _latest_basket_for_user(user_id)
    assoc = _normalize(_association_scores(seed_items), "assoc", "assoc_norm")
    repl = _normalize(_replenishment_scores(user_id), "repl", "repl_norm")
    cf = _normalize(_cf_scores(user_id), "cf", "cf_norm")

    candidates = pd.DataFrame({"product_key": _purchases_df["product_key"].unique()})
    candidates = candidates.merge(assoc, on="product_key", how="left")
    candidates = candidates.merge(repl, on="product_key", how="left")
    candidates = candidates.merge(cf, on="product_key", how="left")
    candidates = candidates.fillna(0.0)
    if seed_items:
        candidates = candidates[~candidates["product_key"].isin(seed_items)]

    candidates["hybrid_score"] = (
        w_assoc * candidates["assoc_norm"]
        + w_repl * candidates["repl_norm"]
        + w_cf * candidates["cf_norm"]
    )
    candidates = candidates[candidates["hybrid_score"] > 0].sort_values("hybrid_score", ascending=False).head(top_k)

    name_map = (
        _purchases_df.groupby("product_key")["item_name"]
        .agg(lambda s: s.value_counts().index[0])
        .to_dict()
    )
    cat_map = (
        _purchases_df.groupby("product_key")["category"]
        .agg(lambda s: s.value_counts().index[0])
        .to_dict()
    )

    result: list[dict] = []
    for _, row in candidates.iterrows():
        reasons = []
        if row["assoc_norm"] > 0:
            reasons.append("association")
        if row["repl_norm"] > 0:
            reasons.append("replenishment")
        if row["cf_norm"] > 0:
            reasons.append("collaborative")
        result.append(
            {
                "productKey": row["product_key"],
                "itemName": name_map.get(row["product_key"], row["product_key"]),
                "category": cat_map.get(row["product_key"], "GENEL"),
                "score": float(row["hybrid_score"]),
                "reasons": reasons,
            }
        )
    return result

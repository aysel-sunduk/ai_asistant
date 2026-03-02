"""
Shopping recommendation hybrid engine:
- Association (FP-Growth rules)
- Replenishment (repeat timing)
- Collaborative filtering (user-based KNN)
- Popularity + user category affinity boosters
"""

from __future__ import annotations

import ast
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
_item_popularity_df = pd.DataFrame()
_svd_user_factors = None
_svd_item_factors = None
_svd_mappings = {}
_tfidf_matrix = None
_tfidf_vectorizer = None
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

    if "quantity" not in out.columns:
        out["quantity"] = 1
    out["quantity"] = pd.to_numeric(out["quantity"], errors="coerce").fillna(1).clip(lower=1)

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


def _serialize_itemset(x) -> list[str]:
    if isinstance(x, (set, frozenset, list, tuple)):
        return sorted([str(v) for v in x])
    if pd.isna(x):
        return []
    return [str(x)]


def _deserialize_itemset(x) -> set[str]:
    if isinstance(x, (set, frozenset)):
        return {str(v) for v in x}
    if isinstance(x, list):
        return {str(v) for v in x}
    if isinstance(x, str):
        raw = x.strip()
        if not raw:
            return set()
        if raw.startswith("[") or raw.startswith("{") or raw.startswith("("):
            try:
                parsed = ast.literal_eval(raw)
                if isinstance(parsed, (set, frozenset, list, tuple)):
                    return {str(v) for v in parsed}
            except (ValueError, SyntaxError):
                pass
        return {raw}
    return set()


def _compute_item_popularity(purchases: pd.DataFrame) -> pd.DataFrame:
    if purchases.empty:
        return pd.DataFrame(columns=["product_key", "pop"])
    pop = purchases.groupby("product_key").size().reset_index(name="pop")
    return pop


def train_and_save_artifacts(df: pd.DataFrame) -> None:
    global _rules_df, _purchases_df, _item_popularity_df, _loaded

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

    rules_to_save = rules.copy()
    if not rules_to_save.empty:
        rules_to_save["antecedents"] = rules_to_save["antecedents"].apply(_serialize_itemset)
        rules_to_save["consequents"] = rules_to_save["consequents"].apply(_serialize_itemset)

    item_popularity = _compute_item_popularity(purchases)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    rules_to_save.to_parquet(MODEL_DIR / "association_rules.parquet", index=False)
    purchases.to_parquet(MODEL_DIR / "purchases.parquet", index=False)
    item_popularity.to_parquet(MODEL_DIR / "item_popularity.parquet", index=False)

    _rules_df = rules_to_save
    _purchases_df = purchases
    _item_popularity_df = item_popularity
    _loaded = True
    logger.info("Shopping recommender artifacts saved at %s", MODEL_DIR)


def _load_artifacts() -> bool:
    global _rules_df, _purchases_df, _item_popularity_df, _loaded
    global _svd_user_factors, _svd_item_factors, _svd_mappings
    global _tfidf_matrix, _tfidf_vectorizer
    try:
        rules_path = MODEL_DIR / "association_rules.parquet"
        purchases_path = MODEL_DIR / "purchases.parquet"
        item_popularity_path = MODEL_DIR / "item_popularity.parquet"
        svd_user_path = MODEL_DIR / "svd_user_factors.npy"
        svd_item_path = MODEL_DIR / "svd_item_factors.npy"
        svd_mapping_path = MODEL_DIR / "svd_mappings.pkl"
        tfidf_matrix_path = MODEL_DIR / "tfidf_matrix.npz"
        tfidf_model_path = MODEL_DIR / "tfidf_model.pkl"

        if not rules_path.exists() or not purchases_path.exists():
            logger.info("Basic shopping artifacts not found in %s", MODEL_DIR)
            _loaded = False
            return False

        _rules_df = pd.read_parquet(rules_path)
        _purchases_df = pd.read_parquet(purchases_path)

        if item_popularity_path.exists():
            _item_popularity_df = pd.read_parquet(item_popularity_path)
        else:
            _item_popularity_df = _compute_item_popularity(_purchases_df)

        # SVD Yükleme
        import pickle
        if svd_user_path.exists() and svd_item_path.exists() and svd_mapping_path.exists():
            _svd_user_factors = np.load(str(svd_user_path))
            _svd_item_factors = np.load(str(svd_item_path))
            with open(svd_mapping_path, "rb") as f:
                _svd_mappings = pickle.load(f)
            logger.info("SVD artifacts loaded.")

        # TF-IDF Yükleme
        from scipy.sparse import load_npz
        if tfidf_matrix_path.exists() and tfidf_model_path.exists():
            _tfidf_matrix = load_npz(str(tfidf_matrix_path))
            with open(tfidf_model_path, "rb") as f:
                _tfidf_vectorizer = pickle.load(f)
            logger.info("TF-IDF artifacts loaded.")

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


def _latest_basket_for_user(user_id: str, purchases_df: pd.DataFrame) -> set[str]:
    u = purchases_df[purchases_df["user_id"].astype(str) == str(user_id)].copy()
    if u.empty:
        return set()
    latest_list = u.sort_values("checked_at").iloc[-1]["list_id"]
    return set(u[u["list_id"] == latest_list]["product_key"].unique().tolist())


def _association_scores(seed_items: set[str], rules_df: pd.DataFrame) -> pd.DataFrame:
    if rules_df.empty or not seed_items:
        return pd.DataFrame(columns=["product_key", "assoc"])

    scores: dict[str, float] = {}
    for _, r in rules_df.iterrows():
        ant = _deserialize_itemset(r.get("antecedents"))
        con = _deserialize_itemset(r.get("consequents"))
        overlap = len(seed_items & ant)
        if overlap == 0:
            continue
        strength = float(r.get("lift", 0)) * float(r.get("confidence", 0)) * overlap / max(len(ant), 1)
        for item in con:
            scores[item] = max(scores.get(item, 0.0), strength)

    if not scores:
        return pd.DataFrame(columns=["product_key", "assoc"])
    return pd.DataFrame({"product_key": list(scores.keys()), "assoc": list(scores.values())})


def _replenishment_scores(user_id: str, purchases_df: pd.DataFrame) -> pd.DataFrame:
    u = purchases_df[purchases_df["user_id"].astype(str) == str(user_id)].copy()
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


def _tfidf_similar_scores(cart_products: List[str], top_n: int = 20) -> pd.DataFrame:
    if _tfidf_matrix is None or _tfidf_vectorizer is None or not cart_products:
        return pd.DataFrame(columns=["product_key", "tfidf"])

    # This is a bit simplified compared to notebook but uses the same principle
    # Mapping cart product keys to indices
    item2idx = {v: k for k, v in _svd_mappings.get("idx2item", {}).items()}
    cart_indices = [item2idx[pk] for pk in cart_products if pk in item2idx]

    if not cart_indices:
        return pd.DataFrame(columns=["product_key", "tfidf"])

    from sklearn.metrics.pairwise import cosine_similarity
    # Average vector of cart items
    cart_vec = _tfidf_matrix[cart_indices].mean(axis=0)
    sim_scores = cosine_similarity(cart_vec, _tfidf_matrix).flatten()

    idx2item = _svd_mappings["idx2item"]
    recs = []
    # Get top N similar items excluding the ones already in cart
    top_indices = sim_scores.argsort()[-(top_n + len(cart_indices)) :][::-1]
    for idx in top_indices:
        pk = idx2item[idx]
        if pk not in cart_products:
            recs.append({"product_key": pk, "tfidf": float(sim_scores[idx])})

    return pd.DataFrame(recs)


def _svd_scores(user_id: str) -> pd.DataFrame:
    if _svd_user_factors is None or str(user_id) not in _svd_mappings.get("user2idx", {}):
        return pd.DataFrame(columns=["product_key", "svd"])

    user2idx = _svd_mappings["user2idx"]
    idx2item = _svd_mappings["idx2item"]
    uidx = user2idx[str(user_id)]

    scores = _svd_item_factors @ _svd_user_factors[uidx]
    recs = []
    for i, s in enumerate(scores):
        if s > 0:
            recs.append({"product_key": idx2item[i], "svd": float(s)})
    return pd.DataFrame(recs)


def _cf_scores(user_id: str, purchases_df: pd.DataFrame) -> pd.DataFrame:
    # Fallback to KNN CF if SVD is not available
    if _svd_user_factors is not None:
        return _svd_scores(user_id).rename(columns={"svd": "cf"})

    ui = purchases_df.groupby(["user_id", "product_key"]).size().reset_index(name="cnt")
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
    vals = np.log1p(ui["cnt"].astype(float).values)
    mat = csr_matrix((vals, (rows, cols)), shape=(len(user_ids), len(item_ids)))

    uidx = user2idx[str(user_id)]
    k_neighbors = 40 # Default value
    n_neighbors = min(k_neighbors + 1, mat.shape[0])
    if n_neighbors <= 1:
        return pd.DataFrame(columns=["product_key", "cf"])

    knn = NearestNeighbors(metric="cosine", algorithm="brute", n_neighbors=n_neighbors)
    knn.fit(mat)
    dists, nbrs = knn.kneighbors(mat[uidx], return_distance=True)

    nbr_idxs = nbrs[0][1:]
    sims = np.clip(1.0 - dists[0][1:], 0.0, 1.0)
    if sims.size == 0:
        return pd.DataFrame(columns=["product_key", "cf"])

    profile = mat[nbr_idxs].multiply(sims.reshape(-1, 1)).sum(axis=0)
    profile = np.asarray(profile).ravel()

    idx2item = {v: k for k, v in item2idx.items()}
    recs = [{"product_key": idx2item[i], "cf": float(profile[i])} for i in np.where(profile > 0)[0]]
    return pd.DataFrame(recs)


def _category_preference_scores(user_id: str, purchases_df: pd.DataFrame) -> pd.DataFrame:
    u = purchases_df[purchases_df["user_id"].astype(str) == str(user_id)].copy()
    if u.empty:
        return pd.DataFrame(columns=["product_key", "cat_pref"])
    cat_pref = u.groupby("category").size()
    if cat_pref.empty:
        return pd.DataFrame(columns=["product_key", "cat_pref"])
    cat_pref = cat_pref / max(cat_pref.max(), 1)
    item_cat = purchases_df[["product_key", "category"]].drop_duplicates("product_key")
    item_cat["cat_pref"] = item_cat["category"].map(cat_pref).fillna(0.0)
    return item_cat[["product_key", "cat_pref"]]


def _normalize(df: pd.DataFrame, col: str, out_col: str) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["product_key", out_col])
    work = df.copy()
    scaler = MinMaxScaler()
    vals = work[[col]].astype(float).values
    if np.allclose(vals.max(), vals.min()):
        work[out_col] = 1.0
    else:
        work[out_col] = scaler.fit_transform(vals)
    return work[["product_key", out_col]]


def _recommend_with_data(
    user_id: str,
    purchases_df: pd.DataFrame,
    rules_df: pd.DataFrame,
    item_popularity_df: pd.DataFrame,
    top_k: int = 20,
    w_assoc: float = 0.35,
    w_repl: float = 0.25,
    w_cf: float = 0.20,
    w_pop: float = 0.10,
    w_cat: float = 0.10,
    seed_items_override: set[str] | None = None,
    exclude_items: set[str] | None = None,
    cart_items: list[dict] | None = None, # Added cart_items parameter
) -> list[dict]:
    if purchases_df.empty:
        return []

    seed_items = seed_items_override if seed_items_override is not None else _latest_basket_for_user(user_id, purchases_df)
    assoc_scores = _association_scores(seed_items, rules_df)
    repl_scores = _replenishment_scores(user_id, purchases_df)
    cf_scores = _cf_scores(user_id, purchases_df)
    pop_scores = item_popularity_df.rename(columns={"pop": "pop_raw"})
    cat_scores = _category_preference_scores(user_id, purchases_df)

    tfidf_scores = pd.DataFrame(columns=["product_key", "tfidf"])
    if cart_items:
        cart_pks = [item.get("product_key") for item in cart_items if item.get("product_key")]
        if cart_pks:
            tfidf_scores = _tfidf_similar_scores(cart_pks)

    assoc = _normalize(assoc_scores, "assoc", "assoc_norm")
    repl = _normalize(repl_scores, "repl", "repl_norm")
    cf = _normalize(cf_scores, "cf", "cf_norm")
    pop = _normalize(pop_scores, "pop_raw", "pop_norm")
    cat = _normalize(cat_scores, "cat_pref", "cat_norm")
    tfidf = _normalize(tfidf_scores, "tfidf", "tfidf_norm") # Normalize TF-IDF scores

    candidates = pd.DataFrame({"product_key": purchases_df["product_key"].astype(str).unique()})
    candidates = candidates.merge(assoc, on="product_key", how="left")
    candidates = candidates.merge(repl, on="product_key", how="left")
    candidates = candidates.merge(cf, on="product_key", how="left")
    candidates = candidates.merge(pop, on="product_key", how="left")
    candidates = candidates.merge(cat, on="product_key", how="left")
    candidates = candidates.merge(tfidf, on="product_key", how="left") # Merge TF-IDF scores
    candidates = candidates.fillna(0.0)

    if exclude_items is None and seed_items:
        candidates = candidates[~candidates["product_key"].isin(seed_items)]
    elif exclude_items:
        candidates = candidates[~candidates["product_key"].isin(exclude_items)]

    w_tfidf = 0.5 # New weight for hybrid v3
    candidates["hybrid_score"] = (
        w_assoc * candidates["assoc_norm"]
        + w_repl * candidates["repl_norm"]
        + w_cf * candidates["cf_norm"]
        + w_tfidf * candidates.get("tfidf", 0).fillna(0) # Scaling could be added but let's keep it simple
        + w_pop * candidates["pop_norm"]
        + w_cat * candidates["cat_norm"]
    )
    candidates = candidates[candidates["hybrid_score"] > 0].sort_values("hybrid_score", ascending=False).head(top_k)

    name_map = (
        purchases_df.groupby("product_key")["item_name"]
        .agg(lambda s: s.value_counts().index[0])
        .to_dict()
    )
    cat_map = (
        purchases_df.groupby("product_key")["category"]
        .agg(lambda s: s.value_counts().index[0])
        .to_dict()
    )
    candidates = candidates[candidates["hybrid_score"] > 0]

    # En son isimleri ve kategorileri al
    meta = purchases_df.sort_values("checked_at", ascending=False).drop_duplicates("product_key")
    candidates = candidates.merge(meta[["product_key", "item_name", "category"]], on="product_key", how="left")

    result = []
    for _, row in candidates.sort_values("hybrid_score", ascending=False).head(top_k).iterrows():
        reasons = []
        if row["assoc_norm"] > 0:
            reasons.append("association")
        if row["repl_norm"] > 0:
            reasons.append("replenishment")
        if row["cf_norm"] > 0:
            reasons.append("personalized" if _svd_user_factors is not None else "collaborative")
        if row["cat_norm"] > 0:
            reasons.append("category_affinity")
        if row.get("tfidf", 0) > 0:
            reasons.append("similar_to_cart")
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


def recommend_for_user(
    user_id: str,
    top_k: int = 20,
    w_assoc: float = 0.35,
    w_repl: float = 0.25,
    w_cf: float = 0.20,
    w_pop: float = 0.10,
    w_cat: float = 0.10,
) -> list[dict]:
    if not _loaded or _purchases_df.empty:
        raise ValueError("Shopping recommender model is not loaded.")
    return _recommend_with_data(
        user_id=user_id,
        purchases_df=_purchases_df,
        rules_df=_rules_df,
        item_popularity_df=_item_popularity_df,
        top_k=top_k,
        w_assoc=w_assoc,
        w_repl=w_repl,
        w_cf=w_cf,
        w_pop=w_pop,
        w_cat=w_cat,
    )


def evaluate_model(top_k: int = 10, max_users: int = 200) -> dict:
    if not _loaded or _purchases_df.empty:
        raise ValueError("Shopping recommender model is not loaded.")

    user_groups = _purchases_df.groupby("user_id")
    eligible_users: list[str] = []
    for user_id, g in user_groups:
        if g["list_id"].nunique() >= 2:
            eligible_users.append(str(user_id))
    if not eligible_users:
        return {
            "topK": top_k,
            "usersEvaluated": 0,
            "recallAtK": 0.0,
            "hitRateAtK": 0.0,
            "ndcgAtK": 0.0,
            "coverageAtK": 0.0,
        }

    if max_users > 0 and len(eligible_users) > max_users:
        eligible_users = eligible_users[:max_users]

    recalls = []
    hits = []
    ndcgs = []
    all_recommended = set()
    all_catalog = set(_purchases_df["product_key"].astype(str).unique().tolist())

    for user_id in eligible_users:
        g = _purchases_df[_purchases_df["user_id"].astype(str) == user_id].copy()
        list_time = (
            g.groupby("list_id")["checked_at"]
            .max()
            .reset_index()
            .sort_values("checked_at")
        )
        if len(list_time) < 2:
            continue

        seed_list = list_time.iloc[-2]["list_id"]
        target_list = list_time.iloc[-1]["list_id"]

        seed_items = set(g[g["list_id"] == seed_list]["product_key"].astype(str).unique().tolist())
        expected = set(g[g["list_id"] == target_list]["product_key"].astype(str).unique().tolist())
        if not expected:
            continue

        recs = _recommend_with_data(
            user_id=user_id,
            purchases_df=_purchases_df,
            rules_df=_rules_df,
            item_popularity_df=_item_popularity_df,
            top_k=top_k,
            seed_items_override=seed_items,
            exclude_items=set(),  # next-basket tahmini icin tekrar urunleri de izinli.
        )
        pred = [r["productKey"] for r in recs[:top_k]]
        if not pred:
            recalls.append(0.0)
            hits.append(0.0)
            ndcgs.append(0.0)
            continue

        all_recommended.update(pred)
        hit_count = len(set(pred) & expected)
        recalls.append(hit_count / max(len(expected), 1))
        hits.append(1.0 if hit_count > 0 else 0.0)

        dcg = 0.0
        for i, item in enumerate(pred, start=1):
            if item in expected:
                dcg += 1.0 / np.log2(i + 1)
        idcg = sum(1.0 / np.log2(i + 1) for i in range(1, min(len(expected), top_k) + 1))
        ndcgs.append(dcg / idcg if idcg > 0 else 0.0)

    users_eval = len(recalls)
    return {
        "topK": top_k,
        "usersEvaluated": users_eval,
        "recallAtK": float(np.mean(recalls)) if recalls else 0.0,
        "hitRateAtK": float(np.mean(hits)) if hits else 0.0,
        "ndcgAtK": float(np.mean(ndcgs)) if ndcgs else 0.0,
        "coverageAtK": float(len(all_recommended) / max(len(all_catalog), 1)),
    }

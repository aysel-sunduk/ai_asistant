"""
Finans Modülü — Hibrit Yatırım Öneri Sistemi
3 Katmanlı Mimari:
  1. Risk Profili: KMeans ile kullanıcı segmentasyonu (Conservative/Moderate/Aggressive)
  2. Collaborative Filtering: SVD ile kullanıcı-yatırım benzerliği
  3. Content-Based: Asset feature'ları ile risk uyumu

Eğitilmiş modeller models_saved/investment_recommender/ klasöründen yüklenir.
Model yoksa fallback (popülerlik + kural tabanlı) mantık çalışır.
"""

import logging
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent / "models_saved" / "investment_recommender"

# ─── Global Model Değişkenleri ───────────────────────────────────
_risk_kmeans = None
_risk_scaler = None
_cf_svd_user_factors = None
_cf_svd_item_factors = None
_cf_mappings: Dict[str, Any] = {}
_asset_features_df: Optional[pd.DataFrame] = None
_models_loaded = False

# ─── Risk Profili Sabitleri ──────────────────────────────────────
RISK_SEGMENTS = {
    0: "Conservative",
    1: "Moderate",
    2: "Aggressive",
}

RISK_LABELS_TR = {
    "Conservative": "Muhafazakar",
    "Moderate": "Dengeli",
    "Aggressive": "Agresif",
}

# Türkçe BUY/SELL/HOLD reason template'leri
REASON_TEMPLATES = {
    "BUY": [
        "{symbol} son {days} günde %{change:.1f} düşüş gösterdi, alım fırsatı olabilir.",
        "Portföy çeşitlendirmesi için {symbol} önerilir. Risk profilinize ({risk_tr}) uygun.",
        "{symbol} benzer yatırım profilindeki kullanıcılar tarafından tercih ediliyor.",
        "Teknik göstergelere göre {symbol} destek seviyesinde, alım değerlendirilebilir.",
    ],
    "HOLD": [
        "{symbol} portföyünüzde mevcut. Mevcut pozisyonu koruma önerilir.",
        "{symbol} stabil seyrediyor, pozisyonunuzu koruyun.",
        "Portföyünüzün %{weight:.0f}'ini oluşturan {symbol} için bekleme önerilir.",
    ],
    "SELL": [
        "{symbol} son {days} günde %{change:.1f} yükseldi, kar realizasyonu değerlendirilebilir.",
        "{symbol} risk profiliniz ({risk_tr}) için fazla volatil, azaltma düşünülebilir.",
        "Portföy dengeleme amacıyla {symbol} pozisyonunu küçültme önerilir.",
    ],
}

# Popüler döviz/metal/kripto listesi (cold-start için)
DEFAULT_ASSETS = [
    {"symbol": "USD/TRY", "asset_type": "CURRENCY", "risk_level": "LOW"},
    {"symbol": "EUR/TRY", "asset_type": "CURRENCY", "risk_level": "LOW"},
    {"symbol": "GBP/TRY", "asset_type": "CURRENCY", "risk_level": "LOW"},
    {"symbol": "XAU/TRY", "asset_type": "METAL", "risk_level": "MEDIUM"},
    {"symbol": "XAG/TRY", "asset_type": "METAL", "risk_level": "MEDIUM"},
    {"symbol": "BTC/USD", "asset_type": "CRYPTO", "risk_level": "HIGH"},
    {"symbol": "ETH/USD", "asset_type": "CRYPTO", "risk_level": "HIGH"},
    {"symbol": "EUR/USD", "asset_type": "CURRENCY", "risk_level": "LOW"},
    {"symbol": "GBP/USD", "asset_type": "CURRENCY", "risk_level": "LOW"},
    {"symbol": "JPY/TRY", "asset_type": "CURRENCY", "risk_level": "MEDIUM"},
]


# ═══════════════════════════════════════════════════════════════════
# MODEL YÜKLEME
# ═══════════════════════════════════════════════════════════════════

def _load_models() -> bool:
    """Eğitilmiş modelleri yükle."""
    global _risk_kmeans, _risk_scaler
    global _cf_svd_user_factors, _cf_svd_item_factors, _cf_mappings
    global _asset_features_df, _models_loaded

    if not MODEL_DIR.exists():
        logger.info("Investment recommender model klasörü bulunamadı: %s", MODEL_DIR)
        return False

    try:
        import joblib
        import pickle

        # Risk profili modelleri
        risk_kmeans_path = MODEL_DIR / "risk_kmeans.joblib"
        risk_scaler_path = MODEL_DIR / "risk_scaler.joblib"

        if risk_kmeans_path.exists() and risk_scaler_path.exists():
            _risk_kmeans = joblib.load(risk_kmeans_path)
            _risk_scaler = joblib.load(risk_scaler_path)
            logger.info("✅ Risk profili modeli yüklendi.")
        else:
            logger.info("Risk profili model dosyaları eksik, fallback kullanılacak.")

        # CF modeli
        cf_user_path = MODEL_DIR / "cf_svd_user_factors.npy"
        cf_item_path = MODEL_DIR / "cf_svd_item_factors.npy"
        cf_mappings_path = MODEL_DIR / "cf_mappings.pkl"

        if cf_user_path.exists() and cf_item_path.exists() and cf_mappings_path.exists():
            _cf_svd_user_factors = np.load(cf_user_path)
            _cf_svd_item_factors = np.load(cf_item_path)
            with open(cf_mappings_path, "rb") as f:
                _cf_mappings = pickle.load(f)
            logger.info("✅ Collaborative filtering modeli yüklendi.")
        else:
            logger.info("CF model dosyaları eksik, fallback kullanılacak.")

        # Asset feature'ları
        asset_features_path = MODEL_DIR / "asset_features.pkl"
        if asset_features_path.exists():
            _asset_features_df = pd.read_pickle(asset_features_path)
            logger.info("✅ Asset feature verileri yüklendi (%d araç).", len(_asset_features_df))
        else:
            logger.info("Asset feature dosyası eksik.")

        _models_loaded = True
        logger.info("✅ Investment recommender modelleri yüklendi!")
        return True

    except Exception as e:
        logger.error("Investment recommender modelleri yüklenemedi: %s", e)
        _models_loaded = False
        return False


def is_model_loaded() -> bool:
    """Model yükleme durumunu döner."""
    return _models_loaded


def reload_model() -> bool:
    """Modelleri tekrar yükle."""
    return _load_models()


# ═══════════════════════════════════════════════════════════════════
# KATMAN 1: RİSK PROFİLİ
# ═══════════════════════════════════════════════════════════════════

def _extract_risk_features(user_data: dict) -> np.ndarray:
    """
    Kullanıcı verisinden risk profili feature'ları çıkar.
    Feature vektörü: [avg_expense, expense_volatility, savings_ratio,
                      category_diversity, investment_count, total_investment_value,
                      favorite_count]
    """
    return np.array([[
        float(user_data.get("avg_monthly_expense", 0)),
        float(user_data.get("expense_volatility", 0)),
        float(user_data.get("savings_ratio", 0)),
        int(user_data.get("category_diversity", 0)),
        int(user_data.get("investment_count", 0)),
        float(user_data.get("total_investment_value", 0)),
        int(user_data.get("favorite_count", 0)),
    ]])


def get_risk_profile(user_data: dict) -> dict:
    """
    Kullanıcı risk profilini döner.
    ML modeli varsa KMeans, yoksa kural tabanlı fallback.
    """
    features = _extract_risk_features(user_data)

    if _risk_kmeans is not None and _risk_scaler is not None:
        scaled = _risk_scaler.transform(features)
        cluster = int(_risk_kmeans.predict(scaled)[0])
        segment = RISK_SEGMENTS.get(cluster, "Moderate")
        method = "ml"
    else:
        # Fallback: kural tabanlı
        savings_ratio = features[0][2]
        investment_count = features[0][4]
        total_value = features[0][5]

        if investment_count <= 1 and total_value < 10000:
            segment = "Conservative"
        elif investment_count >= 5 or total_value > 100000:
            segment = "Aggressive"
        else:
            segment = "Moderate"
        method = "fallback"

    return {
        "segment": segment,
        "segment_tr": RISK_LABELS_TR.get(segment, "Dengeli"),
        "method": method,
        "features": {
            "avg_monthly_expense": round(float(features[0][0]), 2),
            "savings_ratio": round(float(features[0][2]), 2),
            "investment_count": int(features[0][4]),
            "total_investment_value": round(float(features[0][5]), 2),
        },
    }


# ═══════════════════════════════════════════════════════════════════
# KATMAN 2: COLLABORATIVE FILTERING
# ═══════════════════════════════════════════════════════════════════

def _cf_scores(user_id: str) -> Dict[str, float]:
    """
    SVD tabanlı collaborative filtering skorları.
    user_id → symbol → predicted_score
    """
    if _cf_svd_user_factors is None or _cf_svd_item_factors is None:
        return {}

    user_idx_map = _cf_mappings.get("user_to_idx", {})
    idx_to_item = _cf_mappings.get("idx_to_item", {})

    if user_id not in user_idx_map:
        return {}

    user_idx = user_idx_map[user_id]
    user_vec = _cf_svd_user_factors[user_idx]
    scores_vec = user_vec @ _cf_svd_item_factors.T

    result = {}
    for item_idx, score in enumerate(scores_vec):
        symbol = idx_to_item.get(item_idx)
        if symbol:
            result[symbol] = float(score)
    return result


def _popularity_scores(interactions_df: Optional[pd.DataFrame] = None) -> Dict[str, float]:
    """
    Genel popülerlik skorları (tüm kullanıcılardan).
    Cold-start kullanıcılar için fallback.
    """
    if interactions_df is not None and len(interactions_df) > 0:
        counts = interactions_df["symbol"].value_counts()
        max_count = counts.max() if len(counts) > 0 else 1
        return {symbol: float(count / max_count) for symbol, count in counts.items()}

    # Varsayılan popülerlik (hiç veri yoksa)
    default_pop = {}
    for i, asset in enumerate(DEFAULT_ASSETS):
        default_pop[asset["symbol"]] = 1.0 - (i * 0.08)
    return default_pop


# ═══════════════════════════════════════════════════════════════════
# KATMAN 3: CONTENT-BASED (RİSK UYUMU)
# ═══════════════════════════════════════════════════════════════════

RISK_LEVEL_SCORES = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
SEGMENT_RISK_PREFERENCE = {
    "Conservative": {"LOW": 1.0, "MEDIUM": 0.4, "HIGH": 0.1},
    "Moderate": {"LOW": 0.6, "MEDIUM": 1.0, "HIGH": 0.5},
    "Aggressive": {"LOW": 0.3, "MEDIUM": 0.7, "HIGH": 1.0},
}


def _content_scores(risk_segment: str, candidate_assets: List[dict]) -> Dict[str, float]:
    """
    Risk profiline göre content-based skorlar.
    Her asset'in risk seviyesini kullanıcının risk segmentine göre puanlar.
    """
    prefs = SEGMENT_RISK_PREFERENCE.get(risk_segment, SEGMENT_RISK_PREFERENCE["Moderate"])
    scores = {}

    for asset in candidate_assets:
        symbol = asset.get("symbol", "")
        risk_level = asset.get("risk_level", "MEDIUM")

        base_score = prefs.get(risk_level, 0.5)

        # Asset feature'lardan trend skoru ekle
        if _asset_features_df is not None and symbol in _asset_features_df.index:
            row = _asset_features_df.loc[symbol]
            trend = row.get("trend_score", 0)
            volatility = row.get("volatility_30d", 0)

            # Trend pozitifse BUY'a, negatifse SELL'e doğru ağırlık
            trend_bonus = np.clip(trend * 0.2, -0.3, 0.3)

            # Volatilite: risk segmentine göre bonus/ceza
            if risk_segment == "Aggressive":
                vol_bonus = np.clip(volatility * 0.1, 0, 0.2)
            elif risk_segment == "Conservative":
                vol_bonus = np.clip(-volatility * 0.15, -0.3, 0)
            else:
                vol_bonus = 0

            base_score += trend_bonus + vol_bonus

        scores[symbol] = float(np.clip(base_score, 0, 1))

    return scores


# ═══════════════════════════════════════════════════════════════════
# HİBRİT SKOR BİRLEŞTİRME + ÖNERİ ÜRET
# ═══════════════════════════════════════════════════════════════════

def _determine_action(
    symbol: str,
    final_score: float,
    user_holdings: Dict[str, dict],
    trend_info: Optional[dict] = None,
) -> str:
    """BUY/HOLD/SELL kararı."""
    is_held = symbol in user_holdings

    if is_held:
        if final_score >= 0.6:
            return "HOLD"
        elif final_score < 0.3:
            return "SELL"
        else:
            return "HOLD"
    else:
        if final_score >= 0.5:
            return "BUY"
        elif final_score >= 0.3:
            return "HOLD"  # İzle anlamında
        else:
            return "HOLD"


def _generate_reason(
    action: str,
    symbol: str,
    risk_segment: str,
    score: float,
    user_holdings: Dict[str, dict],
) -> str:
    """Türkçe açıklama üret."""
    import random

    risk_tr = RISK_LABELS_TR.get(risk_segment, "Dengeli")
    templates = REASON_TEMPLATES.get(action, REASON_TEMPLATES["HOLD"])
    template = random.choice(templates)

    # Template değişkenleri
    weight = 0
    if symbol in user_holdings:
        total_value = sum(h.get("value", 0) for h in user_holdings.values())
        holding_value = user_holdings[symbol].get("value", 0)
        if total_value > 0:
            weight = (holding_value / total_value) * 100

    try:
        return template.format(
            symbol=symbol,
            risk_tr=risk_tr,
            change=abs(score * 10),
            days=30,
            weight=weight,
        )
    except (KeyError, IndexError):
        return f"{symbol} için {action} önerilir. Risk profili: {risk_tr}."


def _score_to_confidence(score: float) -> float:
    """0-1 arası skoru 0-100 confidence'a çevir."""
    return round(np.clip(score * 100, 10, 95), 1)


def _risk_level_for_asset(asset: dict) -> str:
    """Asset için risk seviyesi belirle."""
    risk = asset.get("risk_level", "MEDIUM")
    if risk in ("LOW", "MEDIUM", "HIGH"):
        return risk
    asset_type = asset.get("asset_type", "").upper()
    if asset_type == "CRYPTO":
        return "HIGH"
    elif asset_type == "METAL":
        return "MEDIUM"
    return "LOW"


def recommend_for_user(
    user_id: str,
    user_data: dict,
    user_holdings: Dict[str, dict],
    user_favorites: List[str],
    interactions_df: Optional[pd.DataFrame] = None,
    top_k: int = 10,
    w_cf: float = 0.35,
    w_content: float = 0.25,
    w_pop: float = 0.15,
    w_trend: float = 0.25,
) -> dict:
    """
    Kullanıcıya kişiselleştirilmiş yatırım önerileri üret.

    Args:
        user_id: Kullanıcı UUID
        user_data: Risk profili feature'ları (transactions'dan)
        user_holdings: Mevcut portföy {symbol: {quantity, value, asset_type}}
        user_favorites: Favori sembol listesi
        interactions_df: Tüm kullanıcıların interaction verisi (CF için)
        top_k: Döndürülecek öneri sayısı
        w_cf: Collaborative filtering ağırlığı
        w_content: Content/risk uyum ağırlığı
        w_pop: Popülerlik ağırlığı
        w_trend: Trend ağırlığı

    Returns:
        Öneri dictionary'si
    """
    # 1. Risk profili
    risk_profile = get_risk_profile(user_data)
    risk_segment = risk_profile["segment"]

    # 2. Aday havuzu: portföy + favoriler + varsayılan popüler araçlar
    candidate_set: Dict[str, dict] = {}

    # Portföydekiler
    for symbol, holding in user_holdings.items():
        candidate_set[symbol] = {
            "symbol": symbol,
            "asset_type": holding.get("asset_type", "CURRENCY"),
            "risk_level": _risk_level_for_asset(holding),
            "in_portfolio": True,
            "is_favorite": symbol in user_favorites,
        }

    # Favoriler
    for symbol in user_favorites:
        if symbol not in candidate_set:
            candidate_set[symbol] = {
                "symbol": symbol,
                "asset_type": "CURRENCY",
                "risk_level": "MEDIUM",
                "in_portfolio": False,
                "is_favorite": True,
            }

    # Varsayılan popüler araçlar
    for asset in DEFAULT_ASSETS:
        if asset["symbol"] not in candidate_set:
            candidate_set[asset["symbol"]] = {
                **asset,
                "in_portfolio": False,
                "is_favorite": False,
            }

    candidates = list(candidate_set.values())

    # 3. Her katmandan skorları al
    cf_raw = _cf_scores(user_id)
    pop_raw = _popularity_scores(interactions_df)
    content_raw = _content_scores(risk_segment, candidates)

    # 4. Normalize et
    def _normalize(scores: Dict[str, float]) -> Dict[str, float]:
        if not scores:
            return scores
        vals = list(scores.values())
        min_v, max_v = min(vals), max(vals)
        rng = max_v - min_v if max_v != min_v else 1.0
        return {k: (v - min_v) / rng for k, v in scores.items()}

    cf_norm = _normalize(cf_raw)
    pop_norm = _normalize(pop_raw)
    content_norm = _normalize(content_raw)

    # 5. Hibrit skor hesapla
    scored_items = []
    for asset in candidates:
        symbol = asset["symbol"]

        s_cf = cf_norm.get(symbol, 0.5)  # CF skoru yoksa nötr
        s_content = content_norm.get(symbol, 0.5)
        s_pop = pop_norm.get(symbol, 0.3)

        # Trend skoru: asset_features varsa kullan, yoksa nötr
        s_trend = 0.5
        if _asset_features_df is not None and symbol in _asset_features_df.index:
            trend_val = _asset_features_df.loc[symbol].get("trend_score", 0)
            s_trend = float(np.clip((trend_val + 1) / 2, 0, 1))  # -1..1 → 0..1

        # Favori/portföy bonus
        bonus = 0.0
        if asset.get("is_favorite"):
            bonus += 0.05
        if asset.get("in_portfolio"):
            bonus += 0.03

        final = (
            w_cf * s_cf
            + w_content * s_content
            + w_pop * s_pop
            + w_trend * s_trend
            + bonus
        )

        scored_items.append({
            "symbol": symbol,
            "asset_type": asset.get("asset_type", "CURRENCY"),
            "risk_level": _risk_level_for_asset(asset),
            "final_score": float(final),
            "scores": {
                "cf": round(s_cf, 3),
                "content": round(s_content, 3),
                "popularity": round(s_pop, 3),
                "trend": round(s_trend, 3),
            },
            "in_portfolio": asset.get("in_portfolio", False),
            "is_favorite": asset.get("is_favorite", False),
        })

    # 6. Sırala ve top-K seç
    scored_items.sort(key=lambda x: x["final_score"], reverse=True)
    top_items = scored_items[:top_k]

    # 7. BUY/HOLD/SELL + reason + confidence üret
    recommendations = []
    for item in top_items:
        symbol = item["symbol"]
        action = _determine_action(symbol, item["final_score"], user_holdings)
        confidence = _score_to_confidence(item["final_score"])
        reason = _generate_reason(action, symbol, risk_segment, item["final_score"], user_holdings)

        # validUntil: 7 gün sonra
        valid_until = (datetime.now() + timedelta(days=7)).isoformat()

        recommendations.append({
            "recommendationType": action,
            "assetType": item["asset_type"],
            "symbol": symbol,
            "confidenceScore": confidence,
            "reason": reason,
            "riskLevel": item["risk_level"],
            "targetPrice": None,  # Fiyat verisi varsa doldurulur
            "validUntil": valid_until,
            "scores": item["scores"],
            "inPortfolio": item["in_portfolio"],
            "isFavorite": item["is_favorite"],
        })

    method = "ml" if _models_loaded and _risk_kmeans is not None else "fallback"

    return {
        "userId": user_id,
        "riskProfile": risk_profile,
        "recommendations": recommendations,
        "totalCandidates": len(scored_items),
        "method": method,
    }


# ═══════════════════════════════════════════════════════════════════
# EĞİTİM FONKSİYONLARI
# ═══════════════════════════════════════════════════════════════════

def train_risk_model(user_features_df: pd.DataFrame) -> dict:
    """
    Risk profili KMeans modelini eğit ve kaydet.

    Args:
        user_features_df: Kullanıcı feature'ları DataFrame'i
            Columns: avg_monthly_expense, expense_volatility, savings_ratio,
                     category_diversity, investment_count, total_investment_value,
                     favorite_count
    """
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    import joblib

    global _risk_kmeans, _risk_scaler

    feature_cols = [
        "avg_monthly_expense", "expense_volatility", "savings_ratio",
        "category_diversity", "investment_count", "total_investment_value",
        "favorite_count",
    ]

    X = user_features_df[feature_cols].fillna(0).values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(X_scaled)

    # Cluster'ları risk seviyesine göre sırala
    # (ortalama investment_count + total_value'ya göre aggressive olanı bul)
    cluster_stats = []
    for c in range(3):
        mask = kmeans.labels_ == c
        avg_inv = X[mask, 4].mean() if mask.sum() > 0 else 0  # investment_count
        avg_val = X[mask, 5].mean() if mask.sum() > 0 else 0  # total_investment_value
        cluster_stats.append((c, avg_inv + avg_val / 10000))

    cluster_stats.sort(key=lambda x: x[1])
    # En düşük → Conservative (0), Orta → Moderate (1), En yüksek → Aggressive (2)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(kmeans, MODEL_DIR / "risk_kmeans.joblib")
    joblib.dump(scaler, MODEL_DIR / "risk_scaler.joblib")

    _risk_kmeans = kmeans
    _risk_scaler = scaler

    logger.info("✅ Risk profili modeli eğitildi ve kaydedildi. %d kullanıcı, 3 cluster.", len(X))

    return {
        "model": "risk_kmeans",
        "n_users": len(X),
        "n_clusters": 3,
        "cluster_sizes": [int((kmeans.labels_ == i).sum()) for i in range(3)],
        "inertia": round(float(kmeans.inertia_), 2),
    }


def train_cf_model(interactions_df: pd.DataFrame, n_factors: int = 20) -> dict:
    """
    SVD tabanlı collaborative filtering modelini eğit.

    Args:
        interactions_df: user_id, symbol, score (implicit rating) DataFrame'i
        n_factors: SVD latent factor sayısı
    """
    from sklearn.decomposition import TruncatedSVD
    from scipy.sparse import csr_matrix
    import pickle

    global _cf_svd_user_factors, _cf_svd_item_factors, _cf_mappings

    # User/Item indexleri oluştur
    users = interactions_df["user_id"].unique()
    items = interactions_df["symbol"].unique()

    user_to_idx = {u: i for i, u in enumerate(users)}
    item_to_idx = {it: i for i, it in enumerate(items)}
    idx_to_item = {i: it for it, i in item_to_idx.items()}

    # Sparse interaction matrix
    rows = interactions_df["user_id"].map(user_to_idx).values
    cols = interactions_df["symbol"].map(item_to_idx).values
    vals = interactions_df["score"].values.astype(float)

    matrix = csr_matrix((vals, (rows, cols)), shape=(len(users), len(items)))

    # SVD
    n_components = min(n_factors, min(matrix.shape) - 1)
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(matrix)
    item_factors = svd.components_.T

    # Kaydet
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    np.save(MODEL_DIR / "cf_svd_user_factors.npy", user_factors)
    np.save(MODEL_DIR / "cf_svd_item_factors.npy", item_factors)

    mappings = {
        "user_to_idx": user_to_idx,
        "item_to_idx": item_to_idx,
        "idx_to_item": idx_to_item,
    }
    with open(MODEL_DIR / "cf_mappings.pkl", "wb") as f:
        pickle.dump(mappings, f)

    _cf_svd_user_factors = user_factors
    _cf_svd_item_factors = item_factors
    _cf_mappings = mappings

    explained_var = float(svd.explained_variance_ratio_.sum())
    logger.info(
        "✅ CF modeli eğitildi. %d kullanıcı, %d araç, %d faktör, açıklanan varyans: %.1f%%",
        len(users), len(items), n_components, explained_var * 100,
    )

    return {
        "model": "cf_svd",
        "n_users": len(users),
        "n_items": len(items),
        "n_factors": n_components,
        "explained_variance": round(explained_var, 4),
    }


def save_asset_features(asset_features_df: pd.DataFrame) -> dict:
    """
    Asset feature DataFrame'ini kaydet.

    Beklenen columns: symbol (index), volatility_30d, trend_score,
                      daily_change_pct, asset_type, risk_level
    """
    global _asset_features_df

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    asset_features_df.to_pickle(MODEL_DIR / "asset_features.pkl")
    _asset_features_df = asset_features_df

    logger.info("✅ Asset feature'ları kaydedildi. %d araç.", len(asset_features_df))

    return {
        "saved": True,
        "n_assets": len(asset_features_df),
        "columns": list(asset_features_df.columns),
    }


def train_and_save_all(
    user_features_df: pd.DataFrame,
    interactions_df: pd.DataFrame,
    asset_features_df: Optional[pd.DataFrame] = None,
) -> dict:
    """Tüm modelleri eğit ve kaydet."""
    results = {}

    # Risk profili
    try:
        results["risk_model"] = train_risk_model(user_features_df)
    except Exception as e:
        logger.error("Risk modeli eğitilemedi: %s", e)
        results["risk_model"] = {"error": str(e)}

    # Collaborative filtering
    try:
        results["cf_model"] = train_cf_model(interactions_df)
    except Exception as e:
        logger.error("CF modeli eğitilemedi: %s", e)
        results["cf_model"] = {"error": str(e)}

    # Asset features
    if asset_features_df is not None:
        try:
            results["asset_features"] = save_asset_features(asset_features_df)
        except Exception as e:
            logger.error("Asset feature'ları kaydedilemedi: %s", e)
            results["asset_features"] = {"error": str(e)}

    return results

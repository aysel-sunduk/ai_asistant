"""
Oyun Modülü — Oyuncu Segmentasyonu (K-Means) + Performans Trendi (Linear Regression)
Eğitilmiş modeller models_saved/game_analyzer/ klasöründen yüklenir.
Model yoksa fallback (kural tabanlı) mantık çalışır.
"""

import logging
from pathlib import Path
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent / "models_saved" / "game_analyzer"

# Global değişkenler
_kmeans_model = None
_scaler = None
_linreg_model = None
_models_loaded = False

# Segment etiketleri (cluster index → insan-okunabilir)
SEGMENT_LABELS = {
    0: "Başlangıç",
    1: "Gelişen",
    2: "Düzenli",
    3: "Usta",
}

SEGMENT_MESSAGES = {
    "Başlangıç": "Yeni başladın, her oyun bir öğrenme fırsatı! 🌱",
    "Gelişen": "Güzel ilerliyorsun, böyle devam et! 📈",
    "Düzenli": "İstikrarlı bir oyuncusun, harika! 💪",
    "Usta": "Üst düzey performans, tebrikler! 🏆",
}


def _load_models():
    """K-Means ve LinearRegression modellerini yükle."""
    global _kmeans_model, _scaler, _linreg_model, _models_loaded

    if not MODEL_DIR.exists():
        logger.info("Game analyzer model klasörü bulunamadı: %s", MODEL_DIR)
        return False

    try:
        import joblib

        scaler_path = MODEL_DIR / "scaler.joblib"
        kmeans_path = MODEL_DIR / "kmeans.joblib"
        linreg_path = MODEL_DIR / "linreg.joblib"

        if not all(p.exists() for p in [scaler_path, kmeans_path, linreg_path]):
            logger.info("Game analyzer model dosyaları eksik.")
            return False

        _scaler = joblib.load(scaler_path)
        _kmeans_model = joblib.load(kmeans_path)
        _linreg_model = joblib.load(linreg_path)
        _models_loaded = True
        logger.info("✅ Game analyzer modelleri yüklendi!")
        return True

    except Exception as e:
        logger.error("Game analyzer modelleri yüklenemedi: %s", e)
        _models_loaded = False
        return False


def is_models_loaded() -> bool:
    """Model yükleme durumunu döner."""
    return _models_loaded


def _extract_player_features(scores: List[dict]) -> np.ndarray:
    """
    Skor listesinden oyuncu feature'larını çıkarır.
    Feature vektörü: [avg_score, score_std, play_count, avg_duration, improvement_rate]
    """
    if not scores:
        return np.array([[0, 0, 0, 0, 0]])

    score_vals = [s.get("score", 0) for s in scores]
    durations = [s.get("durationSec", 0) or 0 for s in scores]

    avg_score = np.mean(score_vals) if score_vals else 0
    score_std = np.std(score_vals) if len(score_vals) > 1 else 0
    play_count = len(scores)
    avg_duration = np.mean(durations) if durations else 0

    # Gelişim oranı: son yarının ortalaması vs ilk yarının ortalaması
    if len(score_vals) >= 4:
        half = len(score_vals) // 2
        first_half_avg = np.mean(score_vals[:half])
        second_half_avg = np.mean(score_vals[half:])
        improvement_rate = (
            (second_half_avg - first_half_avg) / max(first_half_avg, 1)
        ) * 100
    else:
        improvement_rate = 0

    return np.array([[avg_score, score_std, play_count, avg_duration, improvement_rate]])


def get_player_segment(scores: List[dict]) -> dict:
    """
    Oyuncu segmentini döner.
    ML modeli varsa K-Means, yoksa kural tabanlı fallback.
    """
    features = _extract_player_features(scores)

    if _models_loaded and _kmeans_model is not None and _scaler is not None:
        # ML mode
        scaled = _scaler.transform(features)
        cluster = int(_kmeans_model.predict(scaled)[0])
        label = SEGMENT_LABELS.get(cluster, "Bilinmiyor")
        method = "ml"
    else:
        # Fallback: kural tabanlı
        avg_score = features[0][0]
        play_count = features[0][2]
        improvement = features[0][4]

        if play_count < 5:
            label = "Başlangıç"
        elif avg_score < 300 or improvement < -10:
            label = "Gelişen"
        elif avg_score < 700:
            label = "Düzenli"
        else:
            label = "Usta"
        method = "fallback"

    message = SEGMENT_MESSAGES.get(label, "Oyununa devam et! 🎮")

    return {
        "segment": label,
        "message": message,
        "method": method,
        "stats": {
            "avgScore": round(float(features[0][0]), 1),
            "scoreStd": round(float(features[0][1]), 1),
            "playCount": int(features[0][2]),
            "avgDuration": round(float(features[0][3]), 1),
            "improvementRate": round(float(features[0][4]), 1),
        },
    }


def get_performance_trend(scores: List[dict]) -> dict:
    """
    Performans trendini hesaplayıp döner.
    ML modeli varsa LinearRegression, yoksa basit hesap.
    """
    if not scores or len(scores) < 2:
        return {
            "trend": "yetersiz_veri",
            "improvementPct": 0,
            "message": "Trend hesaplamak için en az 2 oyun gerekli.",
            "method": "insufficient_data",
            "weeklyAvgScores": [],
        }

    # Skorları zamana göre sırala (eski → yeni)
    sorted_scores = sorted(scores, key=lambda s: s.get("playedAt", ""))
    score_vals = [s.get("score", 0) for s in sorted_scores]

    # X = oyun indeksi, y = skor
    X = np.arange(len(score_vals)).reshape(-1, 1)
    y = np.array(score_vals)

    if _models_loaded and _linreg_model is not None:
        # ML mode — eğitilmiş modelin katsayılarını kullan
        slope = float(_linreg_model.coef_[0])
        method = "ml"
    else:
        # Fallback — basit lineer regresyon hesapla
        from numpy.polynomial.polynomial import polyfit
        coeffs = polyfit(X.flatten(), y, 1)
        slope = coeffs[1]
        method = "fallback"

    # Trend yönü
    avg_score = float(np.mean(score_vals))
    if avg_score > 0:
        improvement_pct = round((slope / avg_score) * 100 * len(score_vals), 1)
    else:
        improvement_pct = 0

    if slope > 0.5:
        trend = "yükseliş"
        emoji = "📈"
    elif slope < -0.5:
        trend = "düşüş"
        emoji = "📉"
    else:
        trend = "stabil"
        emoji = "➡️"

    # Haftalık ortalamalar (son 4 hafta)
    weekly_avgs = []
    if len(score_vals) >= 7:
        week_size = max(len(score_vals) // 4, 1)
        for i in range(0, len(score_vals), week_size):
            chunk = score_vals[i : i + week_size]
            weekly_avgs.append(round(float(np.mean(chunk)), 1))

    # Son N oyun vs önceki N oyun karşılaştırma
    half = len(score_vals) // 2
    first_avg = float(np.mean(score_vals[:half]))
    second_avg = float(np.mean(score_vals[half:]))
    actual_change = round(
        ((second_avg - first_avg) / max(first_avg, 1)) * 100, 1
    )

    if actual_change > 0:
        message = f"Son oyunlarında %{abs(actual_change)} gelişme gösterdin! {emoji}"
    elif actual_change < 0:
        message = f"Son oyunlarında %{abs(actual_change)} düşüş var, toparlanabilirsin! {emoji}"
    else:
        message = f"Performansın stabil devam ediyor. {emoji}"

    return {
        "trend": trend,
        "improvementPct": actual_change,
        "slopePerGame": round(slope, 2),
        "message": message,
        "method": method,
        "recentAvg": round(second_avg, 1),
        "previousAvg": round(first_avg, 1),
        "weeklyAvgScores": weekly_avgs,
    }

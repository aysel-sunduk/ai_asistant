"""
Motivasyon Mesajı Modülü — Oyuncu Davranışına Göre Dinamik Mesaj Seçimi
Eğitilmiş RandomForestClassifier modeli models_saved/motivation_model/ klasöründen yüklenir.
Model yoksa fallback (kural tabanlı) mantık çalışır.
"""

import logging
import json
import random
from pathlib import Path
from typing import Dict, Optional

import numpy as np

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent / "models_saved" / "motivation_model"

# Global değişkenler
_classifier = None
_scaler = None
_encoders = None
_metadata = None
_models_loaded = False

# Motivasyon durumu etiketleri
LABEL_NAMES = {
    0: "yeni_oyuncu",
    1: "dusuk_etkilesim",
    2: "gelisen_oyuncu",
    3: "aktif_oyuncu",
    4: "basarili_oyuncu",
    5: "uzun_sure_oynayan",
}

# Motivasyon mesajları — her durum için birden fazla mesaj
MOTIVATION_MESSAGES = {
    0: {
        "name": "yeni_oyuncu",
        "messages": [
            "Hoş geldin! İlk adımlarını attın, harika! 🌟",
            "Yeni başladın ama potansiyelin büyük! 🌱",
            "Her usta bir zamanlar çıraktı, devam et! 🎯",
            "Oyun dünyasına hoş geldin, macera başlıyor! 🎉",
        ],
    },
    1: {
        "name": "dusuk_etkilesim",
        "messages": [
            "Seni özledik! Bir oyun daha oynamaya ne dersin? 🎮",
            "Biraz mola verdin, geri dönüşün müthiş olacak! 💪",
            "Küçük adımlarla başla, büyük sonuçlar gelecek! 🚀",
            "Her oyun bir fırsat, kaçırma! ⭐",
        ],
    },
    2: {
        "name": "gelisen_oyuncu",
        "messages": [
            "Güzel ilerliyorsun, böyle devam! 📈",
            "Gelişimin gözüküyor, harikalar yaratıyorsun! 🌟",
            "Her oyunla daha da iyileşiyorsun! 💪",
            "Yeteneklerin gelişiyor, tebrikler! 🏆",
        ],
    },
    3: {
        "name": "aktif_oyuncu",
        "messages": [
            "Harika tempoya devam! Enerjin bulaşıcı! 🔥",
            "Aktif bir oyuncusun, bu enerjiyi koru! 🚀",
            "Sürekli oynamak seni daha da güçlü yapıyor! 💪",
            "Kararlılığın takdire değer, devam et! ⭐",
        ],
    },
    4: {
        "name": "basarili_oyuncu",
        "messages": [
            "Üst düzey performans, tebrikler şampiyon! 🏆",
            "Başarıların ilham verici! Zirvede kalmaya devam! 🌟",
            "Gerçek bir usta! Yeni rekorlara hazır mısın? 👑",
            "Muhteşem performans! Herkes senden öğreniyor! 💫",
        ],
    },
    5: {
        "name": "uzun_sure_oynayan",
        "messages": [
            "Harika oynuyorsun! Ama biraz mola vermeyi unutma 😊",
            "Enerjin müthiş! Bir çay molasına ne dersin? ☕",
            "Uzun süredir oynuyorsun, gözlerin için kısa bir ara iyi olur! 👀",
            "Tutku güzel ama sağlık da önemli, dengeli kal! 💚",
        ],
    },
}

# Kategorik değişkenler için varsayılan encoding
DEFAULT_CATEGORICAL_ENCODINGS = {
    "Gender": {"Female": 0, "Male": 1},
    "Location": {"Asia": 0, "Europe": 1, "Other": 2, "USA": 3},
    "GameGenre": {"Action": 0, "RPG": 1, "Simulation": 2, "Sports": 3, "Strategy": 4},
    "GameDifficulty": {"Easy": 0, "Hard": 1, "Medium": 2},
}


def _load_models():
    """Motivasyon modeli dosyalarını yükle."""
    global _classifier, _scaler, _encoders, _metadata, _models_loaded

    if not MODEL_DIR.exists():
        logger.info("Motivation model klasörü bulunamadı: %s", MODEL_DIR)
        return False

    try:
        import joblib

        classifier_path = MODEL_DIR / "motivation_classifier.joblib"
        scaler_path = MODEL_DIR / "scaler.joblib"
        encoders_path = MODEL_DIR / "label_encoders.joblib"
        metadata_path = MODEL_DIR / "metadata.json"

        if not classifier_path.exists() or not scaler_path.exists():
            logger.info("Motivation model dosyaları eksik.")
            return False

        _classifier = joblib.load(classifier_path)
        _scaler = joblib.load(scaler_path)

        if encoders_path.exists():
            _encoders = joblib.load(encoders_path)

        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                _metadata = json.load(f)

        _models_loaded = True
        logger.info("✅ Motivation modeli yüklendi!")
        return True

    except Exception as e:
        logger.error("Motivation modeli yüklenemedi: %s", e)
        _models_loaded = False
        return False


def is_model_loaded() -> bool:
    """Model yükleme durumunu döner."""
    return _models_loaded


def _encode_categorical(value: str, category: str) -> int:
    """Kategorik değeri encode et."""
    if _metadata and "categorical_encodings" in _metadata:
        encodings = _metadata["categorical_encodings"].get(category, {})
    else:
        encodings = DEFAULT_CATEGORICAL_ENCODINGS.get(category, {})

    return encodings.get(value, 0)


def _build_features(
    age: int,
    play_time_hours: float,
    in_game_purchases: int,
    sessions_per_week: int,
    avg_session_duration: int,
    player_level: int,
    achievements_unlocked: int,
    gender: str = "Male",
    location: str = "USA",
    game_genre: str = "Action",
    game_difficulty: str = "Medium",
) -> np.ndarray:
    """Oyuncu verilerinden feature vektörü oluştur."""
    gender_enc = _encode_categorical(gender, "Gender")
    location_enc = _encode_categorical(location, "Location")
    genre_enc = _encode_categorical(game_genre, "GameGenre")
    difficulty_enc = _encode_categorical(game_difficulty, "GameDifficulty")

    return np.array([[
        age, play_time_hours, in_game_purchases, sessions_per_week,
        avg_session_duration, player_level, achievements_unlocked,
        gender_enc, location_enc, genre_enc, difficulty_enc,
    ]])


def _fallback_predict(
    player_level: int,
    play_time_hours: float,
    sessions_per_week: int,
    achievements_unlocked: int,
    avg_session_duration: int,
) -> int:
    """Model yoksa kural tabanlı motivasyon durumu tahmini."""
    if player_level <= 15 and achievements_unlocked <= 10 and sessions_per_week <= 3:
        return 0  # yeni_oyuncu

    if play_time_hours >= 18 and avg_session_duration >= 150:
        return 5  # uzun_sure_oynayan

    if sessions_per_week <= 3 and play_time_hours <= 5:
        return 1  # dusuk_etkilesim

    if player_level >= 70 and achievements_unlocked >= 40:
        return 4  # basarili_oyuncu

    if sessions_per_week >= 5 and play_time_hours >= 8:
        return 3  # aktif_oyuncu

    return 2  # gelisen_oyuncu


def get_motivation_message(
    age: int = 25,
    play_time_hours: float = 5.0,
    in_game_purchases: int = 0,
    sessions_per_week: int = 3,
    avg_session_duration: int = 60,
    player_level: int = 20,
    achievements_unlocked: int = 10,
    gender: str = "Male",
    location: str = "USA",
    game_genre: str = "Action",
    game_difficulty: str = "Medium",
) -> dict:
    """
    Oyuncu verilerine göre motivasyon mesajı döner.
    ML modeli varsa RandomForest, yoksa kural tabanlı fallback.
    """
    confidence = None

    if _models_loaded and _classifier is not None and _scaler is not None:
        # ML mode
        features = _build_features(
            age, play_time_hours, in_game_purchases, sessions_per_week,
            avg_session_duration, player_level, achievements_unlocked,
            gender, location, game_genre, game_difficulty,
        )
        scaled = _scaler.transform(features)
        prediction = int(_classifier.predict(scaled)[0])
        probabilities = _classifier.predict_proba(scaled)[0]
        confidence = round(float(probabilities[prediction]), 3)
        method = "ml"
    else:
        # Fallback
        prediction = _fallback_predict(
            player_level, play_time_hours, sessions_per_week,
            achievements_unlocked, avg_session_duration,
        )
        method = "fallback"

    label_name = LABEL_NAMES.get(prediction, "gelisen_oyuncu")
    messages = MOTIVATION_MESSAGES.get(prediction, MOTIVATION_MESSAGES[2])
    message = random.choice(messages["messages"])

    result = {
        "label": prediction,
        "labelName": label_name,
        "message": message,
        "method": method,
    }

    if confidence is not None:
        result["confidence"] = confidence

    return result

"""
AI Asistan — Türkçe Argo/Küfür Filtresi
Katman 1: Kara liste (500+ kelime) — anında çalışır
Katman 2: ML model (TF-IDF + LogReg) — bağlam anlayan
"""

import os
import re
import logging
from pathlib import Path
from typing import Optional

import joblib

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────
# KATMAN 1 — Türkçe Küfür/Argo Kara Listesi
# Kaynak: GitHub d35k/Turkish-Swear-Words + ooguz/turkce-kufur-karaliste
# ──────────────────────────────────────────────────────────
BLACKLIST = {
    # ── Yaygın küfürler ─────────────────────────────────
    "amk", "aq", "amq", "amına", "amini", "amina",
    "sik", "siktir", "siktirgit", "sikerim", "sikeyim", "sikim",
    "piç", "pic", "piçlik",
    "orospu", "orospuçocuğu", "orospucocugu", "oç", "oc",
    "göt", "got", "götlek", "gotlek", "götoğlanı",
    "yarak", "yarrak", "yarram",
    "taşak", "tassak", "taşşak",
    "meme",
    "kaltak",
    "fahişe", "fahise",
    "pezevenk",
    "puşt", "pust",
    "ibne", "ibnelik",
    "gavat",
    "döl", "dol",
    "hıyar", "hiyar",
    "dalyarak", "dalyarak",
    "amcık", "amcik",
    "çük", "cuk",
    "yarrakkafalı",
    "orosbu",
    "sktr", "sg",
    "mk", "mq",

    # ── Argo / Hakaret ──────────────────────────────────
    "salak", "aptal", "gerizekalı", "gerizekali",
    "mal", "mala", "malın", "malin",
    "dangalak", "hödük", "hoduk",
    "ahmak",
    "andaval", "andavalın",
    "beyinsiz",
    "embesil",
    "geri zekalı", "geri zekali",
    "mankafa",
    "şapşal", "sapsal",
    "sersem",
    "budala",
    "eşek", "esek", "eşşek", "essek",
    "hayvan",
    "it", "köpek", "kopek",
    "domuz",
    "hırsız", "hirsiz",
    "yalancı", "yalanci",
    "ikiyüzlü", "ikiyuzlu",
    "namussuz",
    "şerefsiz", "serefsiz",
    "alçak", "alcak",
    "aşağılık", "asagilik",
    "rezil",
    "kepaze",
    "pislik",
    "sürtük", "surtuk",
    "kahpe",
    "haysiyetsiz",
    "karaktersiz",
    "yavşak", "yavsak",
    "kodumun", "kodumunun",
    "hassiktir", "hass",
    "lan", "ulan", "la",
    "bok", "boktan",
    "sıçmak", "sicmak", "sıç", "sic",
    "osur", "osuruk",
    "terbiyesiz",
    "edepsiz",
    "ahlaksız", "ahlaksiz",
    "kevaşe", "kevase",
    "soysuz",
    "hergele",
    "sefil",
    "züppe", "zuppe",
    "cibilliyetsiz",
    "dingil",
    "gereksiz",
    "koduğumun",
    "lanet", "lanetli",
    "yıkık", "yikik",
    "ezik",
    "zavallı", "zavalli",
    "salakmısın", "salakmisin",
    "gerzek",
    "moruk",
    "enayi",
    "avanak",

    # ── İnternet argosu ─────────────────────────────────
    "amına koyayım", "amina koyayim",
    "siktimin", "siktiğimin",
    "anasını", "anasini", "ananı", "anani",
    "bacını", "bacini",
    "s2m", "s2mci",
    "yrk", "yrrk",
    "mk", "amk",
    "sg", "sgtir",
    "kfr", "küfr",
}

# Türkçe karakter normalizasyonu (kasıtlı yazım bozukluğunu yakalamak için)
_TR_NORMALIZE_MAP = str.maketrans(
    "çğıöşüÇĞIÖŞÜ",
    "cgiosuCGIOSU"
)


def _normalize_turkish(text: str) -> str:
    """Türkçe karakterleri ASCII'ye dönüştür (karşılaştırma için)."""
    return text.translate(_TR_NORMALIZE_MAP).lower()


def _mask_word(word: str) -> str:
    """Kelimeyi maskele: salak → s***k"""
    if len(word) <= 2:
        return "**"
    return word[0] + "*" * (len(word) - 2) + word[-1]


def blacklist_filter(text: str) -> dict:
    """
    Katman 1: Kara liste filtresi.
    Metindeki argo/küfür kelimeleri maskeleyerek döndürür.
    """
    if not text or not text.strip():
        return {
            "cleaned_text": text or "",
            "flagged_words": [],
            "blacklist_hit_count": 0,
        }

    cleaned = text
    flagged_words = []
    normalized_text = _normalize_turkish(text)

    # Çok kelimeli ifadeler için önce kontrol
    multi_word_blacklist = [w for w in BLACKLIST if " " in w]
    single_word_blacklist = [w for w in BLACKLIST if " " not in w]

    # Çok kelimeli ifadeler
    for phrase in multi_word_blacklist:
        normalized_phrase = _normalize_turkish(phrase)
        if normalized_phrase in normalized_text:
            pattern = re.compile(re.escape(phrase), re.IGNORECASE)
            matches = pattern.findall(cleaned)
            if matches:
                for match in matches:
                    flagged_words.append(match)
                replacement = _mask_word(phrase.replace(" ", ""))
                cleaned = pattern.sub(replacement, cleaned)
                normalized_text = _normalize_turkish(cleaned)

    # Tek kelimeler
    words = re.findall(r'\b\w+\b', cleaned)
    for word in words:
        normalized_word = _normalize_turkish(word)
        if normalized_word in {_normalize_turkish(bw) for bw in single_word_blacklist}:
            if word not in flagged_words:
                flagged_words.append(word)
            masked = _mask_word(word)
            # Kelime sınırlarını kullanarak değiştir
            pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
            cleaned = pattern.sub(masked, cleaned)

    return {
        "cleaned_text": cleaned,
        "flagged_words": flagged_words,
        "blacklist_hit_count": len(flagged_words),
    }


# ──────────────────────────────────────────────────────────
# KATMAN 2 — ML Model (TF-IDF + LogReg)
# ──────────────────────────────────────────────────────────

MODEL_DIR = Path(__file__).parent.parent / "models_saved"

_ml_model = None
_ml_vectorizer = None
_ml_loaded = False


def _load_ml_model():
    """Eğitilmiş ML modelini yükle (varsa)."""
    global _ml_model, _ml_vectorizer, _ml_loaded

    if _ml_loaded:
        return _ml_model is not None

    model_path = MODEL_DIR / "profanity_model.joblib"
    vectorizer_path = MODEL_DIR / "profanity_vectorizer.joblib"

    if model_path.exists() and vectorizer_path.exists():
        try:
            _ml_model = joblib.load(model_path)
            _ml_vectorizer = joblib.load(vectorizer_path)
            logger.info("ML profanity model yüklendi: %s", model_path)
            _ml_loaded = True
            return True
        except Exception as e:
            logger.warning("ML model yüklenemedi: %s", e)
            _ml_loaded = True
            return False
    else:
        logger.info(
            "ML model dosyaları bulunamadı (%s). Sadece kara liste kullanılacak.",
            MODEL_DIR,
        )
        _ml_loaded = True
        return False


def ml_predict(text: str) -> Optional[float]:
    """
    Katman 2: ML modeli ile argo skoru hesapla.
    0.0 = temiz, 1.0 = kesinlikle argo/küfür.
    Model yoksa None döner.
    """
    if not _load_ml_model():
        return None

    try:
        features = _ml_vectorizer.transform([text])
        proba = _ml_model.predict_proba(features)[0]
        # sınıf 1 = offensive/argo
        offensive_idx = list(_ml_model.classes_).index(1)
        return float(proba[offensive_idx])
    except Exception as e:
        logger.warning("ML prediction hatası: %s", e)
        return None


# ──────────────────────────────────────────────────────────
# ANA FONKSİYON — İki katmanı birleştir
# ──────────────────────────────────────────────────────────

def filter_text(text: str, profanity_threshold: float = 0.5) -> dict:
    """
    Ana filtreleme fonksiyonu.
    Hem kara liste hem ML modeli ile analiz yapar.

    Returns:
        {
            "original_text": str,
            "cleaned_text": str,
            "profanity_score": float | None,
            "flagged_words": list[str],
            "blacklist_hit_count": int,
            "is_safe": bool,
            "ml_available": bool,
        }
    """
    # Katman 1: Kara liste
    bl_result = blacklist_filter(text)

    # Katman 2: ML skor
    ml_score = ml_predict(text)
    ml_available = ml_score is not None

    # Güvenlik kararı: kara liste bulgusu VEYA yüksek ML skoru → güvensiz
    is_safe = True
    if bl_result["blacklist_hit_count"] > 0:
        is_safe = False
    if ml_available and ml_score >= profanity_threshold:
        is_safe = False

    return {
        "original_text": text,
        "cleaned_text": bl_result["cleaned_text"],
        "profanity_score": round(ml_score, 4) if ml_score is not None else None,
        "flagged_words": bl_result["flagged_words"],
        "blacklist_hit_count": bl_result["blacklist_hit_count"],
        "is_safe": is_safe,
        "ml_available": ml_available,
    }

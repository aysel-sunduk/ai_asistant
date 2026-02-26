"""
AI Asistan — Blog Başlık Önerisi Modeli
mT5-small (seq2seq) ile blog içeriğinden başlık üretir.
Model yoksa akıllı anahtar-kelime tabanlı fallback kullanır.
"""

import re
import logging
import random
from pathlib import Path

logger = logging.getLogger(__name__)

# Model klasörü
MODEL_DIR = Path(__file__).parent.parent / "models_saved" / "title_generator"

# Global nesneler
_model = None
_tokenizer = None
_model_loaded = False
_is_mt5 = False

# mT5 görev prefix'leri — farklı prefix'ler farklı çıktılar üretir
_MT5_PREFIXES = [
    "summarize: ",
    "başlık üret: ",
    "bu metnin başlığı: ",
]


def _load_model():
    """Title generator modelini yükle — mT5 veya GPT-2 otomatik algıla."""
    global _model, _tokenizer, _model_loaded, _is_mt5

    if not MODEL_DIR.exists():
        logger.info("Title generator model klasörü bulunamadı: %s", MODEL_DIR)
        return False

    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoConfig
        import torch

        logger.info("Title generator model yükleniyor: %s", MODEL_DIR)

        config = AutoConfig.from_pretrained(str(MODEL_DIR))
        model_type = getattr(config, "model_type", "").lower()
        _is_mt5 = "t5" in model_type

        _tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR), use_fast=True)

        if _is_mt5:
            _model = AutoModelForSeq2SeqLM.from_pretrained(str(MODEL_DIR))
            logger.info("✅ mT5 title generator yüklendi (model_type=%s)", model_type)
        else:
            from transformers import GPT2LMHeadModel
            _model = GPT2LMHeadModel.from_pretrained(str(MODEL_DIR))
            logger.info("✅ GPT-2 title generator yüklendi")

        _model.eval()
        _model_loaded = True
        return True

    except Exception as e:
        logger.error("Title generator yüklenemedi: %s", e)
        _model_loaded = False
        return False


def is_model_loaded() -> bool:
    return _model_loaded


def generate_titles(
    content: str,
    category: str = "genel",
    num_suggestions: int = 3,
    max_new_tokens: int = 50,
    temperature: float = 0.8,
) -> dict:
    """Blog içeriğinden başlık önerileri üret."""
    if _model_loaded:
        try:
            if _is_mt5:
                return _generate_mt5(content, num_suggestions)
            else:
                return _generate_gpt2(content, category, num_suggestions, max_new_tokens, temperature)
        except Exception as e:
            logger.error("Model başlık üretimi başarısız, fallback: %s", e)

    return _smart_fallback_titles(content, category, num_suggestions)


# ─── mT5 Inference (Fine-tuned model) ───────────────────────────

def _generate_mt5(content: str, num_suggestions: int) -> dict:
    """Fine-tuned mT5 ile başlık üretimi."""
    import torch

    PREFIX = "baslik olustur: "
    text = PREFIX + content[:2000]
    inputs = _tokenizer(text, return_tensors="pt", max_length=512, truncation=True)

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=64,
            num_return_sequences=num_suggestions,
            num_beams=max(num_suggestions * 2, 6),
            no_repeat_ngram_size=3,
            early_stopping=True,
            length_penalty=0.8,
        )

    titles = []
    for o in outputs:
        title = _tokenizer.decode(o, skip_special_tokens=True).strip()
        if title and len(title) > 5 and title not in titles:
            # İlk cümle kopyasını engelle
            first_sentence = content.strip().split('.')[0].strip()
            if title.lower() != first_sentence.lower():
                titles.append(title[:150])

    titles = list(dict.fromkeys(titles))[:num_suggestions]

    if not titles:
        return _smart_fallback_titles(content, "genel", num_suggestions)

    return {"titles": titles, "model_used": "mt5_finetuned", "category": "genel"}


# ─── GPT-2 Inference (eski model için geriye dönük destek) ───────

def _is_valid_title(title: str) -> bool:
    if not title or len(title) < 5 or len(title) > 150:
        return False
    latin_tr = re.compile(r'^[\w\s\-:,.!?\'\"çğışöüÇĞİŞÖÜ]+$', re.UNICODE)
    if not latin_tr.match(title):
        return False
    non_alpha = len(re.findall(r'[^a-zA-Z\sçğışöüÇĞİŞÖÜ]', title))
    if non_alpha > len(title) * 0.35:
        return False
    return True


def _generate_gpt2(content, category, num_suggestions, max_new_tokens, temperature) -> dict:
    import torch
    prompt = f"<|kategori|>{category}<|icerik|>{content[:300]}<|baslik|>"
    inputs = _tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            num_return_sequences=min(num_suggestions * 2, 8),
            do_sample=True,
            temperature=temperature,
            top_p=0.9,
            pad_token_id=_tokenizer.pad_token_id,
            eos_token_id=_tokenizer.eos_token_id,
        )

    titles = []
    for out in outputs:
        decoded = _tokenizer.decode(out, skip_special_tokens=False)
        if "<|baslik|>" in decoded:
            after = decoded.split("<|baslik|>")[-1]
            title = after.split("<|")[0].strip()
            if _is_valid_title(title):
                titles.append(title[:150])

    titles = list(dict.fromkeys(titles))[:num_suggestions]
    if titles:
        return {"titles": titles, "model_used": "gpt2", "category": category}
    return _smart_fallback_titles(content, category, num_suggestions)


# ─── Akıllı Fallback — Gerçek Başlık Üretimi ────────────────────

_STOP_WORDS = {
    "bir", "bu", "şu", "o", "ve", "ile", "de", "da", "ki", "için",
    "olan", "oldu", "olur", "olarak", "ancak", "ama", "veya", "ya",
    "hem", "kadar", "gibi", "daha", "çok", "en", "her", "hiç", "ne",
    "ise", "mi", "mu", "mı", "mü", "sadece", "değil", "değildir",
    "bunlar", "bunun", "onun", "şey", "bazı", "sonra", "önce",
    "yani", "zaman", "aslında", "görünen", "kısım", "asıl",
    "büyük", "küçük", "ilk", "son", "yeni", "eski", "iyi", "kötü",
}

_CATEGORY_THEMES = {
    "teknoloji": ["Dijital Dönüşüm", "Geleceğin Teknolojisi", "Tech Dünyası"],
    "spor": ["Spor Dünyası", "Sahadan Haberler", "Spor Gündemi"],
    "ekonomi": ["Ekonomi Analizi", "Piyasa Gündemi", "Finans Dünyası"],
    "siyaset": ["Siyasi Gündem", "Gündem Analizi", "Politik Bakış"],
    "kultur": ["Kültür Sanat", "Sanat Dünyası", "Kültürel İzler"],
    "saglik": ["Sağlıklı Yaşam", "Tıp Dünyası", "Sağlık Gündemi"],
    "egitim": ["Eğitim Dünyası", "Öğrenme Yolculuğu", "Eğitim Gündemi"],
}


def _extract_keywords(content: str, top_n: int = 8) -> list[str]:
    """İçerikten en önemli anahtar kelimeleri çıkar."""
    words = re.findall(r'\b[a-zA-ZçğışöüÇĞİŞÖÜ]{4,}\b', content)
    freq: dict[str, int] = {}
    for w in words:
        low = w.lower()
        if low not in _STOP_WORDS and len(low) >= 4:
            freq[low] = freq.get(low, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]]


def _extract_core_topic(content: str) -> str:
    """İçerikten ana konuyu çıkar — en sık geçen 2-3 anahtar kelime."""
    keywords = _extract_keywords(content, 4)
    if len(keywords) >= 2:
        return " ".join(keywords[:3]).capitalize()
    return keywords[0].capitalize() if keywords else "Düşünceler"


def _compress_sentence(sentence: str, max_words: int = 8) -> str:
    """Cümleyi başlık uzunluğuna kısalt — gereksiz kelimeleri çıkar."""
    words = sentence.split()
    # Stop word'leri ve çok kısa kelimeleri çıkar
    important = [w for w in words if w.lower() not in _STOP_WORDS and len(w) > 2]
    if len(important) <= max_words:
        return " ".join(important).capitalize()
    return " ".join(important[:max_words]).capitalize()


def _find_key_sentence(content: str) -> str | None:
    """İçerikten en anlamlı cümleyi bul — soru içermeyen, orta uzunlukta."""
    sentences = re.split(r'(?<=[.!?])\s+', content.strip())
    best = None
    best_score = 0
    keywords = set(_extract_keywords(content, 10))

    for sent in sentences:
        sent = sent.strip().rstrip('.!?')
        if len(sent) < 15 or len(sent) > 200 or '?' in sent:
            continue
        # Skor = keyword hit sayısı (cümledeki anahtar kelime yoğunluğu)
        words = set(re.findall(r'\b\w+\b', sent.lower()))
        score = len(words & keywords)
        # İlk cümle olmamasını tercih et (ilk cümle genelde giriş)
        if sent == sentences[0].strip().rstrip('.!?'):
            score -= 1
        if score > best_score:
            best_score = score
            best = sent

    return best


def _smart_fallback_titles(content: str, category: str, num: int = 3) -> dict:
    """Akıllı kural tabanlı başlık üretici — gerçek, anlamlı başlıklar."""
    titles: list[str] = []
    text = content.strip()
    keywords = _extract_keywords(text, 8)
    core_topic = _extract_core_topic(text)

    # ─── Strateji 1: Konu odaklı başlık (ana fikri özetle) ───
    key_sentence = _find_key_sentence(text)
    if key_sentence:
        compressed = _compress_sentence(key_sentence, 7)
        if 10 < len(compressed) < 100:
            titles.append(compressed)

    # ─── Strateji 2: Şablon tabanlı başlıklar ───
    templates = [
        f"{core_topic} Hakkında Bilmeniz Gerekenler",
        f"{core_topic}: Neden Önemli?",
        f"{core_topic} Üzerine Bir Bakış",
        f"{core_topic} ve Değişen Bakış Açıları",
        f"{core_topic}: Derinlemesine Bir İnceleme",
    ]

    # Kategori temalı şablonlar
    cat_themes = _CATEGORY_THEMES.get(category.lower(), [])
    if cat_themes and keywords:
        kw_cap = keywords[0].capitalize()
        templates.extend([
            f"{random.choice(cat_themes)}: {kw_cap}",
        ])

    # Soru varsa başlık olarak ekle
    questions = re.findall(r'[^.!?]*\?', text)
    for q in questions[:1]:
        q = q.strip()
        if 10 < len(q) < 100:
            titles.append(q)

    # Şablonlardan rastgele seç
    random.shuffle(templates)
    for t in templates:
        if len(titles) >= num:
            break
        if t not in titles and 10 < len(t) < 120:
            titles.append(t)

    # Yeterli başlık yoksa keyword bazlı basit başlık
    while len(titles) < num and keywords:
        kw_combo = " ".join(keywords[:3]).capitalize()
        fallback_title = f"{kw_combo} Üzerine Düşünceler"
        if fallback_title not in titles:
            titles.append(fallback_title)
        keywords = keywords[1:]

    return {
        "titles": titles[:num],
        "model_used": "smart_fallback",
        "category": category,
    }

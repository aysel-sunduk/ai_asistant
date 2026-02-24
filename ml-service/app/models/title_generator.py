"""
AI Asistan — Blog Başlık Önerisi Modeli
mT5-small (seq2seq) ile blog içeriğinden başlık üretir.
Model yoksa akıllı anahtar-kelime tabanlı fallback kullanır.
"""

import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Model klasörü
MODEL_DIR = Path(__file__).parent.parent / "models_saved" / "title_generator"

# Global nesneler
_model = None
_tokenizer = None
_model_loaded = False
_is_mt5 = False       # mT5 mi GPT-2 mi?

PREFIX = "baslik olustur: "   # mT5'in beklediği görev prefix'i


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

        # Model tipini config'den belirle (mT5 vs GPT-2)
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
    """
    Blog içeriğinden başlık önerileri üret.
    """
    if _model_loaded:
        try:
            if _is_mt5:
                return _generate_mt5(content, num_suggestions)
            else:
                return _generate_gpt2(content, category, num_suggestions, max_new_tokens, temperature)
        except Exception as e:
            logger.error("Başlık üretimi başarısız: %s", e)

    return _smart_fallback_titles(content, category, num_suggestions)


# ─── mT5 Inference ──────────────────────────────────────────────

def _generate_mt5(content: str, num_suggestions: int) -> dict:
    """mT5 ile beam search tabanlı başlık üretimi."""
    import torch

    text = PREFIX + content[:500]
    inputs = _tokenizer(text, return_tensors="pt", max_length=512, truncation=True)

    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=60,
            num_return_sequences=num_suggestions,
            num_beams=max(num_suggestions, 4),
            early_stopping=True,
            no_repeat_ngram_size=3,
            length_penalty=1.0,
        )

    titles = []
    for out in outputs:
        title = _tokenizer.decode(out, skip_special_tokens=True).strip()
        if title and len(title) > 5:
            titles.append(title[:150])

    titles = list(dict.fromkeys(titles))

    if not titles:
        return _smart_fallback_titles(content, "genel", num_suggestions)

    return {"titles": titles, "model_used": "mt5", "category": "genel"}


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


# ─── Akıllı Fallback ────────────────────────────────────────────

_STOP_WORDS = {
    "bir", "bu", "şu", "o", "ve", "ile", "de", "da", "ki", "için",
    "olan", "oldu", "ancak", "ama", "veya", "ya", "hem", "kadar",
    "gibi", "daha", "çok", "en", "her", "hiç", "ne",
}

_CATEGORY_PREFIXES = {
    "teknoloji": ["Teknoloji Gündemi:", "Dijital Dünyadan:", "Tech Analizi:"],
    "spor":      ["Spor Dünyasından:", "Sahadaki Gelişmeler:", "Spor Haberleri:"],
    "ekonomi":   ["Ekonomi Analizi:", "Piyasalarda Son Durum:", "Ekonomiden:"],
    "siyaset":   ["Siyasi Gündem:", "Gündemdeki Gelişmeler:", "Siyasette:"],
    "kultur":    ["Kültür Sanat:", "Kültürden Haberler:", "Sanat ve Yaşam:"],
    "saglik":    ["Sağlık Haberleri:", "Tıp Dünyasından:", "Sağlıkta:"],
    "egitim":    ["Eğitim Haberleri:", "Öğrenim Dünyasından:", "Eğitimde:"],
    "genel":     ["", "", ""],
}


def _extract_keywords(content: str, top_n: int = 6) -> list[str]:
    words = re.findall(r'\b[a-zA-ZçğışöüÇĞİŞÖÜ]{4,}\b', content)
    freq: dict[str, int] = {}
    for w in words:
        low = w.lower()
        if low not in _STOP_WORDS:
            freq[low] = freq.get(low, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]]


def _smart_fallback_titles(content: str, category: str, num: int = 3) -> dict:
    titles: list[str] = []
    text = content.strip()

    # 1. Soru cümlelerini başlık yap
    for q in re.findall(r'[^.!?]*\?', text)[:2]:
        q = q.strip()
        if 10 < len(q) < 120:
            titles.append(q)

    # 2. İlk anlamlı cümle (kırpılmış)
    for sent in re.split(r'(?<=[.!?])\s+', text)[:3]:
        sent = sent.strip().rstrip('.!?')
        if 15 < len(sent) < 120 and sent not in titles:
            titles.append(sent)
            break

    # 3. Anahtar-kelime + kategori şablonu
    keywords = _extract_keywords(text)
    if keywords:
        prefixes = _CATEGORY_PREFIXES.get(category.lower(), _CATEGORY_PREFIXES["genel"])
        for prefix in prefixes:
            if len(titles) >= num:
                break
            kw = " ".join(keywords[:4]).capitalize()
            full = f"{prefix} {kw}".strip() if prefix else kw
            if len(full) > 10 and full not in titles:
                titles.append(full)

    return {
        "titles": titles[:num],
        "model_used": "fallback",
        "category": category,
    }

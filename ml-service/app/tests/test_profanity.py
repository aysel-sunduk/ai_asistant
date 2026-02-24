"""
AI Asistan — Küfür/Argo Filtresi Unit Testleri
"""

import sys
import os

# app modülünü import edebilmek için üst dizini ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.models.profanity_filter import blacklist_filter, filter_text, _mask_word


class TestMaskWord:
    """Kelime maskeleme testleri."""

    def test_short_word(self):
        assert _mask_word("ab") == "**"

    def test_normal_word(self):
        result = _mask_word("salak")
        assert result == "s***k"

    def test_longer_word(self):
        result = _mask_word("gerizekali")
        assert result[0] == "g"
        assert result[-1] == "i"
        assert "*" in result


class TestBlacklistFilter:
    """Kara liste filtresi testleri."""

    def test_clean_text_unchanged(self):
        text = "Bugün hava çok güzel, dışarı çıkmak istiyorum"
        result = blacklist_filter(text)
        assert result["cleaned_text"] == text
        assert result["blacklist_hit_count"] == 0
        assert len(result["flagged_words"]) == 0

    def test_single_profanity_masked(self):
        text = "Bu adam çok salak birisi"
        result = blacklist_filter(text)
        assert "salak" not in result["cleaned_text"]
        assert result["blacklist_hit_count"] > 0
        assert "salak" in result["flagged_words"]

    def test_multiple_profanity_masked(self):
        text = "Sen çok aptal ve budala birisin"
        result = blacklist_filter(text)
        assert "aptal" not in result["cleaned_text"]
        assert "budala" not in result["cleaned_text"]
        assert result["blacklist_hit_count"] >= 2

    def test_empty_text(self):
        result = blacklist_filter("")
        assert result["cleaned_text"] == ""
        assert result["blacklist_hit_count"] == 0

    def test_none_text(self):
        result = blacklist_filter(None)
        assert result["cleaned_text"] == ""
        assert result["blacklist_hit_count"] == 0

    def test_case_insensitive(self):
        text = "Bu adam çok SALAK birisi"
        result = blacklist_filter(text)
        assert result["blacklist_hit_count"] > 0


class TestFilterText:
    """Ana filtreleme fonksiyonu testleri."""

    def test_clean_text_is_safe(self):
        text = "Bugün hava çok güzel"
        result = filter_text(text)
        assert result["is_safe"] is True
        assert result["cleaned_text"] == text

    def test_profane_text_not_safe(self):
        text = "Sen çok salak birisin"
        result = filter_text(text)
        assert result["is_safe"] is False
        assert "salak" not in result["cleaned_text"]

    def test_ml_availability_field(self):
        """ML model yüklü değilse ml_available=False olmalı."""
        text = "Test metni"
        result = filter_text(text)
        # Model dosyaları yoksa False olmalı
        assert "ml_available" in result

    def test_original_text_preserved(self):
        text = "Orijinal metin salak içerikli"
        result = filter_text(text)
        assert result["original_text"] == text

    def test_flagged_words_list(self):
        text = "Aptal bir yorum"
        result = filter_text(text)
        assert isinstance(result["flagged_words"], list)


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])

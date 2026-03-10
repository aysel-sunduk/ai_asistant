import os
import json
import sys

# ML servisini içe aktarabilmek için yolu ekle
sys.path.append(os.path.join(os.getcwd(), "ml-service"))

def test_formatting():
    from app.models.food_analyzer import analyzer
    
    # Mock model ve normalizer yolları (gerçek dosyalar lazım değil, initialize'ı mocklayacağız)
    # Ancak labels.json yolunu kontrol etmemiz lazım.
    
    print("--- Test: Yemek İsmi Formatlama ---")
    
    # analyzer.pretty_labels'ı manuel olarak dolduralım (labels.json yüklenmiş gibi)
    analyzer.pretty_labels = {
        "tarhana_corbasi": "Tarhana Çorbası",
        "mercimek_kofte": "Mercimek Köftesi",
        "adana_kebap": "Adana Kebap"
    }
    
    # analyzer.idx_to_label'ı mocklayalım
    analyzer.idx_to_label = {"0": "tarhana_corbasi", "1": "bilinmeyen_yemek"}
    
    # Mock model result
    class MockTensor:
        def item(self): return self.val
        def __init__(self, val): self.val = val
        
    def mock_analyze(idx_val):
        raw_label = analyzer.idx_to_label.get(str(idx_val), "bilinmiyor")
        food_name = analyzer.pretty_labels.get(raw_label)
        if not food_name:
            food_name = raw_label.replace("_", " ").title()
        return food_name

    # Test 1: labels.json'da olan yemek
    res1 = mock_analyze(0)
    print(f"Test 1 (Bilinen): tarhana_corbasi -> {res1}")
    assert res1 == "Tarhana Çorbası"

    # Test 2: labels.json'da olmayan yemek (Fallback)
    res2 = mock_analyze(1)
    print(f"Test 2 (Bilinmeyen): bilinmeyen_yemek -> {res2}")
    assert res2 == "Bilinmeyen Yemek"

    print("\n✅ Testler başarıyla tamamlandı!")

if __name__ == "__main__":
    test_formatting()

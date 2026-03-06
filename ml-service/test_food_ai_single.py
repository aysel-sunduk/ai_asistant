import os
import sys
import torch

# Add current directory to path so it can find app.models
sys.path.append(os.getcwd())

from app.models.food_analyzer import analyzer, _load_model
import io

def log_to_file(msg):
    with open("test_log.txt", "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")
    print(msg)

def test_single_image(image_path):
    if os.path.exists("test_log.txt"): os.remove("test_log.txt")
    log_to_file(f"🔍 Test ediliyor: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Dosya bulunamadı: {image_path}")
        return

    # Modeli yükle
    log_to_file("⏳ Model yükleniyor TEST SCRIPT...")
    m_path = "food-calorie-estimator/checkpoints/best_model.pth"
    log_to_file(f"📁 Dosya yolu: {os.path.abspath(m_path)}")
    ckpt = torch.load(m_path, map_location="cpu")
    log_to_file(f"📦 TEST SCRIPT: Checkpoint anahtarları: {list(ckpt.keys())}")
    if "idx_to_label" in ckpt:
        log_to_file(f"🏷️ TEST SCRIPT: Sınıf sayısı: {len(ckpt['idx_to_label'])}")
    
    _load_model()
    
    if not analyzer.initialized:
        print("❌ Model yüklenemedi!")
        return

    # Analiz et
    try:
        with open(image_path, "rb") as f:
            result = analyzer.analyze(f)
            
        print("\n--- ANALİZ SONUÇLARI ---")
        print(f"Yemek: {result['food_name']}")
        print(f"Doğruluk: %{result['confidence']}")
        print(f"Kalori: {result['calories']} kcal")
        print(f"Protein: {result['protein']} g")
        print(f"Yağ: {result['fat']} g")
        print(f"Karbonhidrat: {result['carbs']} g")
        print("------------------------")
        
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    target_img = "food-calorie-estimator/datasets/test_yemek.webp"
    test_single_image(target_img)

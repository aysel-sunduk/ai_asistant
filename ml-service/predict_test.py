import os
import sys
import torch

# Add current directory to path
sys.path.append(os.getcwd())

from app.models.food_analyzer import analyzer, _load_model

def test_user_image(image_path):
    print(f"🔍 Analiz Başlıyor: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ HATA: Görsel bulunamadı! Yol: {os.path.abspath(image_path)}")
        return

    # Modeli yükle
    print("⏳ Model ve ağırlıklar yükleniyor...")
    _load_model()
    
    if not analyzer.initialized:
        print("❌ HATA: Model ilklendirilemedi!")
        return

    # Analiz et
    try:
        with open(image_path, "rb") as f:
            result = analyzer.analyze(f)
            
        print("\n" + "="*30)
        print("✨ AI ANALİZ SONUCU ✨")
        print("="*30)
        print(f"🍴 Yemek Adı    : {result['food_name']}")
        print(f"🎯 Doğruluk     : %{result['confidence']}")
        print(f"🔥 Kalori       : {result['calories']} kcal")
        print(f"🥩 Protein      : {result['protein']} g")
        print(f"🧈 Yağ          : {result['fat']} g")
        print(f"🍞 Karbonhidrat : {result['carbs']} g")
        print("="*30)
        
    except Exception as e:
        print(f"❌ Analiz sırasında hata oluştu: {e}")

if __name__ == "__main__":
    # Kullanıcının belirttiği tam yol
    target_img = r"D:\Downloads\Ai_asistan\ml-service\food-calorie-estimator\datasets\test_yemek.webp"
    test_user_image(target_img)

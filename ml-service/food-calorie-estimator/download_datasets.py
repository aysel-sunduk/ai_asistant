import os
import subprocess
import shutil

def check_disk_space(required_gb=15):
    total, used, free = shutil.disk_usage(".")
    free_gb = free // (2**30)
    if free_gb < required_gb:
        print(f"⚠️ UYARI: Disk alanı yetersiz olabilir. Gerekli: {required_gb}GB, Mevcut: {free_gb}GB")
        return False
    return True

def download_food101():
    if not check_disk_space():
        return
    print("🚀 Food-101 indiriliyor...")
    target_dir = "datasets/food101"
    os.makedirs(target_dir, exist_ok=True)
    
    try:
        # Check if kaggle is installed
        subprocess.run(["kaggle", "--version"], check=True, capture_output=True)
        
        # Download and unzip
        cmd = [
            "kaggle", "datasets", "download", 
            "-d", "dansbecker/food-101", 
            "-p", target_dir, "--unzip"
        ]
        print(f"Komut çalıştırılıyor: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        print("✅ Food-101 başarıyla indirildi ve çıkartıldı.")
        
    except FileNotFoundError:
        print("❌ HATA: 'kaggle' komutu bulunamadı. Lütfen 'pip install kaggle' yapın.")
    except subprocess.CalledProcessError as e:
        print(f"❌ HATA: Kaggle API hatası. Lütfen kaggle.json dosyasının doğru yerde olduğundan emin olun. ({e})")

if __name__ == "__main__":
    download_food101()

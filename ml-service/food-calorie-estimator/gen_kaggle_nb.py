import json
import os

# Notebook structure
notebook = {
    "cells": [],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "name": "python",
            "version": "3.10"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 5
}

def add_md(text):
    notebook["cells"].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [l + "\n" for l in text.strip().split("\n")]
    })

def add_code(text):
    notebook["cells"].append({
        "cell_type": "code",
        "metadata": {},
        "execution_count": None,
        "outputs": [],
        "source": [l + "\n" for l in text.strip().split("\n")]
    })

# --- Notebook Content ---

add_md("# 🍕 Hibrit Yemek Kalori ve Kategorizasyon Sistemi (Kaggle GPU Edition)")
add_md("""
Bu notebook, yemek fotoğraflarından hem **besin değerlerini** (Kalori, Protein, Yağ, Karbonhidrat) hem de **yemek türünü** (Karnıyarık, Köfte vb.) tahmin eden hibrit bir yapay zeka modeli eğitir.

**Önemli:** Sağ panelden **Settings -> Accelerator** kısmından **GPU T4 x2** veya **P100** seçmeyi unutmayın!
""")

add_md("## 1. Kurulum ve Importlar")
add_code("""
import os, sys, json, time, random, shutil
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from PIL import Image
from tqdm.auto import tqdm
from sklearn.model_selection import train_test_split

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from torchvision.models import efficientnet_v2_s, EfficientNet_V2_S_Weights

print(f"✅ PyTorch versiyon: {torch.version.__version__}")
print(f"✅ Cihaz: {'GPU Aktif 🚀' if torch.cuda.is_available() else 'CPU (Yavaş) ⚠️'}")
""")

add_md("## 2. Konfigürasyon ve Dosya Yapısı Kontrolü")
add_code("""
# Kaggle'daki gerçek dosya yollarını bulmak için bu hücreyi çalıştırın
print("📁 Mevcut Verisetleri:")
for root, dirs, files in os.walk('/kaggle/input'):
    depth = root.replace('/kaggle/input', '').count(os.sep)
    if depth < 2:
        print(f"{'  ' * depth}📂 {os.path.basename(root)}/")

# Kaggle Memory Optimizasyon Ayarları
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

CONFIG = {
    "img_size":    224,
    "batch_size":  16, # Hafıza hatası almamak için 32'den 16'ya düşürüldü
    "epochs":      50,
    "lr":          1e-4,
    "dropout":     0.3,
    "patience":    10,
    "save_dir":    "checkpoints",
    
    # Kaggle Paths - Yukarıdaki çıktıya göre burayı güncellemeniz gerekebilir!
    "food101_dir": "/kaggle/input/food101/images",
    "turkish_dir": "/kaggle/input/turkish-foods", 
}

os.makedirs(CONFIG["save_dir"], exist_ok=True)
""")

add_md("## 3. Veri Seti Yükleme Fonksiyonları")
add_code("""
# Food-101 Kalorileri (Basit Tahminler)
FOOD101_CALORIES = {
    "baklava": 450, "burger": 250, "pizza": 266, "sushi": 150, "tacos": 210, 
    "apple_pie": 237, "baby_back_ribs": 361, "beignets": 451, "bibimbap": 141,
}

def load_data():
    all_data = []
    
    # 🇹🇷 Türk Yemekleri (Global Arama)
    print("🔍 Türk yemekleri aranıyor...")
    labels_path = None
    for root, dirs, files in os.walk('/kaggle/input'):
        if 'labels.json' in files:
            # images klasörünün de aynı dizinde veya alt dizinde olduğunu kontrol edelim
            if os.path.exists(os.path.join(root, 'images')):
                labels_path = os.path.join(root, 'labels.json')
                print(f"✅ Türk yemekleri bulundu: {labels_path}")
                break
    
    if labels_path:
        base_t = os.path.dirname(labels_path)
        labels = json.load(open(labels_path))
        for food_key, info in labels.items():
            food_dir = os.path.join(base_t, "images", food_key)
            if os.path.exists(food_dir):
                for img in os.listdir(food_dir):
                    if img.endswith((".jpg", ".png")):
                        all_data.append({
                            "path": os.path.join(food_dir, img),
                            "label": food_key,
                            "calories": float(info["calories"]),
                            "protein": float(info.get("protein", info["calories"]*0.04)),
                            "fat": float(info.get("fat", info["calories"]*0.03)),
                            "carbs": float(info.get("carbs", info["calories"]*0.12)),
                            "source": "turkish"
                        })
    else:
        print("⚠️ Uyarı: Turkish 'labels.json' ve 'images' klasörü bulunamadı!")
    
    # 🍔 Food-101 (Global Arama)
    print("🔍 Food-101 aranıyor...")
    f_dir = None
    for root, dirs, f in os.walk('/kaggle/input'):
        # Food-101'e has bazı klasörleri kontrol edelim
        if 'apple_pie' in dirs and 'baklava' in dirs:
            f_dir = root
            break

    if f_dir:
        print(f"✅ Food-101 bulundu: {f_dir}")
        for cat in os.listdir(f_dir):
            cat_dir = os.path.join(f_dir, cat)
            if os.path.isdir(cat_dir):
                cal = FOOD101_CALORIES.get(cat, 250)
                imgs = [i for i in os.listdir(cat_dir) if i.endswith((".jpg",".png"))][:300]
                for img in imgs:
                    all_data.append({
                        "path": os.path.join(cat_dir, img),
                        "label": cat,
                        "calories": float(cal),
                        "protein": float(cal*0.04),
                        "fat": float(cal*0.03),
                        "carbs": float(cal*0.12),
                        "source": "food101"
                    })
    else:
        print("⚠️ Uyarı: Food-101 dizini bulunamadı!")
    
    return all_data

print("🚀 Veriler taranıyor...")
raw_data = load_data()
if len(raw_data) == 0:
    print("❌ HATA: Hiç veri bulunamadı! Lütfen verisetlerini 'Add Data' ile eklediğinizden emin olun.")
else:
    print(f"📊 Toplam Örnek: {len(raw_data)}")
    # Kaynak dağılımını göster
    sources = {}
    for d in raw_data: sources[d['source']] = sources.get(d['source'], 0) + 1
    for src, count in sources.items(): print(f"   - {src}: {count} örnek")
""")

add_md("## 4. Model Mimarisi (Multi-Task)")
add_code("""
class MultiTaskCalorieModel(nn.Module):
    def __init__(self, num_classes, dropout=0.3):
        super().__init__()
        base = efficientnet_v2_s(weights=EfficientNet_V2_S_Weights.IMAGENET1K_V1)
        self.backbone = nn.Sequential(*list(base.children())[:-1])
        
        self.neck = nn.Sequential(
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
            nn.Linear(1280, 512), nn.BatchNorm1d(512), nn.SiLU(), nn.Dropout(dropout),
            nn.Linear(512, 256),  nn.BatchNorm1d(256), nn.SiLU(), nn.Dropout(dropout),
        )
        
        # Regression Heads (Besinler)
        self.h_reg = nn.Sequential(nn.Linear(256, 128), nn.SiLU(), nn.Linear(128, 4), nn.Softplus())
        # Classification Head (Yemek Türü)
        self.h_cls = nn.Linear(256, num_classes)

    def forward(self, x):
        f = self.neck(self.backbone(x))
        return self.h_reg(f), self.h_cls(f)
""")

add_md("## 5. Dataset ve Eğitim")
add_code("""
class FoodDataset(Dataset):
    def __init__(self, data, label_to_idx, transform=None):
        self.data = data
        self.transform = transform
        self.l2i = label_to_idx
    def __len__(self): return len(self.data)
    def __getitem__(self, i):
        d = self.data[i]
        img = Image.open(d["path"]).convert("RGB")
        if self.transform: img = self.transform(img)
        target = torch.tensor([d["calories"], d["protein"], d["fat"], d["carbs"]], dtype=torch.float32)
        label = self.l2i[d["label"]]
        return img, target, label

# Normalizasyon (GPU uyumlu)
class Normalizer:
    def __init__(self):
        self.m = None
        self.s = None
        
    def fit(self, x):
        # x numpy array olarak gelir (offline fit)
        self.m = torch.tensor(x.mean(0), dtype=torch.float32)
        self.s = torch.tensor(x.std(0) + 1e-6, dtype=torch.float32)
        
    def norm(self, x):
        # Girdinin cihazına (CPU/GPU) otomatik uydur
        if self.m.device != x.device:
            self.m = self.m.to(x.device)
            self.s = self.s.to(x.device)
        return (x - self.m) / self.s
        
    def denorm(self, x):
        if self.m.device != x.device:
            self.m = self.m.to(x.device)
            self.s = self.s.to(x.device)
        return x * self.s + self.m
""")

add_md("## 6. Ana Eğitim Döngüsü")
add_code("""
def run():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    # Hazırlık
    labels = sorted(list(set(d["label"] for d in raw_data)))
    l2i = {l: i for i, l in enumerate(labels)}
    i2l = {i: l for l, i in l2i.items()}
    
    train_data, val_data = train_test_split(raw_data, test_size=0.15, random_state=42)
    
    norm = Normalizer()
    norm.fit(np.array([[d["calories"], d["protein"], d["fat"], d["carbs"]] for d in train_data]))
    
    tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.1, 0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    train_loader = DataLoader(FoodDataset(train_data, l2i, tf), batch_size=CONFIG["batch_size"], shuffle=True, num_workers=2)
    val_loader   = DataLoader(FoodDataset(val_data, l2i, tf), batch_size=CONFIG["batch_size"])
    
    model = MultiTaskCalorieModel(len(labels)).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=CONFIG["lr"])
    criterion_reg = nn.HuberLoss()
    criterion_cls = nn.CrossEntropyLoss()
    
    best_loss = float("inf")
    patience = 0
    
    print(f"🚀 Eğitim Başlıyor... ({len(labels)} kategori)")
    
    for ep in range(1, CONFIG["epochs"]+1):
        model.train()
        t_loss = 0
        for imgs, targets, labels_idx in tqdm(train_loader, desc=f"Ep {ep}"):
            imgs, targets, labels_idx = imgs.to(device), targets.to(device), labels_idx.to(device)
            optimizer.zero_grad()
            reg, cls = model(imgs)
            loss = criterion_reg(reg, norm.norm(targets)) + 0.3 * criterion_cls(cls, labels_idx)
            loss.backward()
            optimizer.step()
            t_loss += loss.item()
            
        # Validation
        model.eval()
        v_loss = 0
        with torch.no_grad():
            for imgs, targets, labels_idx in val_loader:
                imgs, targets, labels_idx = imgs.to(device), targets.to(device), labels_idx.to(device)
                reg, cls = model(imgs)
                v_loss += (criterion_reg(reg, norm.norm(targets)) + 0.3 * criterion_cls(cls, labels_idx)).item()
        
        v_loss /= len(val_loader)
        print(f"Epoch {ep} | Train Loss: {t_loss/len(train_loader):.4f} | Val Loss: {v_loss:.4f}")
        
        if v_loss < best_loss:
            best_loss = v_loss
            patience = 0
            torch.save({"state": model.state_dict(), "l2i": l2i, "i2l": i2l, "norm_m": norm.m, "norm_s": norm.s}, "best_model.pth")
            print("💾 Yeni En İyi Model Kaydedildi!")
        else:
            patience += 1
            if patience >= CONFIG["patience"]:
                print("⏹️ Early Stopping.")
                break

run()
""")

# Save the notebook
nb_path = r"d:\Downloads\Ai_asistan\ml-service\food-calorie-estimator\food_calorie_kaggle.ipynb"
with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

print(f"Notebook oluşturuldu: {nb_path}")

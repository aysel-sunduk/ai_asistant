import torch
import torch.nn as nn
from torchvision import transforms
from torchvision.models import efficientnet_v2_s, EfficientNet_V2_S_Weights
from PIL import Image
import numpy as np
import os
import json

class CalorieModel(nn.Module):
    def __init__(self, num_classes=150, dropout=0.3):
        super().__init__()
        base = efficientnet_v2_s(weights=None)
        self.backbone = nn.Sequential(*list(base.children())[:-1])
        self.neck = nn.Sequential(
            nn.AdaptiveAvgPool2d(1), nn.Flatten(),
            nn.Linear(1280, 512), nn.BatchNorm1d(512), nn.SiLU(), nn.Dropout(dropout),
            nn.Linear(512, 256),  nn.BatchNorm1d(256), nn.SiLU(), nn.Dropout(dropout),
        )

        # Checkpoint hatasına göre: Gizli katman boyutu 128 olmalı (64 değil)
        self.h_reg = nn.Sequential(
            nn.Linear(256, 128),
            nn.SiLU(),
            nn.Linear(128, 4),
            nn.Softplus()
        )
        self.h_cls = nn.Linear(256, num_classes)


    def forward(self, x):
        f = self.neck(self.backbone(x))
        reg = self.h_reg(f)
        cls = self.h_cls(f)

        return reg, cls

class FoodAnalyzer:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FoodAnalyzer, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def initialize(self, model_path, norm_path):
        if self.initialized: return
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load Labels for Formatting
        self.pretty_labels = {}
        try:
            # model_path: food-calorie-estimator/checkpoints/best_model.pth
            # labels.json: food-calorie-estimator/datasets/turkish_foods/labels.json
            labels_json_path = os.path.join(os.path.dirname(model_path), "../datasets/turkish_foods/labels.json")
            
            if os.path.exists(labels_json_path):
                with open(labels_json_path, "r", encoding="utf-8") as f:
                    labels_data = json.load(f)
                    for key, val in labels_data.items():
                        if "query" in val:
                            # "taze fasulye" -> "Taze Fasulye"
                            self.pretty_labels[key] = " ".join([w.capitalize() for w in val["query"].split()])
                print(f"DEBUG: {len(self.pretty_labels)} yemek ismi labels.json dosyasından yüklendi.")
            else:
                print(f"WARNING: labels.json bulunamadı: {labels_json_path}")
        except Exception as e:
            print(f"WARNING: labels.json yüklenirken hata oluştu: {e}")

        # Load Checkpoint
        ckpt = torch.load(model_path, map_location=self.device)
        print(f"DEBUG: Checkpoint yüklendi, etiket sayısı: {len(ckpt.get('i2l', {}))}")
        
        # Try different naming conventions for label mappings
        self.idx_to_label = ckpt.get("i2l") or ckpt.get("idx_to_label") or {}
        
        num_classes = len(self.idx_to_label)
        
        if num_classes == 0:
            self.label_to_idx = ckpt.get("l2i") or ckpt.get("label_to_idx") or {}
            num_classes = len(self.label_to_idx)
            
            if num_classes == 0:
                raise ValueError("Model checkpoint does not contain label mappings!")
            
            self.idx_to_label = {str(v): k for k, v in self.label_to_idx.items()}
        
        # Load Model
        self.model = CalorieModel(num_classes=num_classes)
        self.model.load_state_dict(ckpt["state"])
        self.model.to(self.device)
        self.model.eval()
        
        # Load Normalizer
        d = np.load(norm_path, allow_pickle=True).item()
        self.norm_m = torch.tensor(d["mean"], dtype=torch.float32).to(self.device)
        self.norm_s = torch.tensor(d["std"], dtype=torch.float32).to(self.device)
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        
        self.initialized = True
        print(f"✅ FoodAnalyzer başlatıldı. {num_classes} sınıf hazır.")

    def analyze(self, image_bytes):
        img = Image.open(image_bytes).convert("RGB")
        img_t = self.transform(img).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            reg, cls = self.model(img_t)
            
            # Categories
            probs = torch.softmax(cls, dim=1)
            prob, idx = torch.max(probs, dim=1)
            
            # Nutrients (Denormalize)
            nutrients = reg[0] * self.norm_s + self.norm_m
            
        # Format Food Name
        raw_label = self.idx_to_label.get(str(idx.item()), self.idx_to_label.get(idx.item(), "bilinmiyor"))
        
        # 1. Önce labels.json eşleşmesine bak
        food_name = self.pretty_labels.get(raw_label)
        
        # 2. Eğer eşleşme yoksa veya labels.json yüklenemediyse fallback kullan
        if not food_name:
            # "taze_fasulye" -> "Taze Fasulye"
            clean_name = str(raw_label).replace("_", " ").strip()
            food_name = " ".join([w.capitalize() for w in clean_name.split()])
            
        return {
            "foodName": food_name,
            "confidence": round(float(prob.item()) * 100, 1),
            "calories": round(max(0, float(nutrients[0])), 1),
            "protein": round(max(0, float(nutrients[1])), 1),
            "fat": round(max(0, float(nutrients[2])), 1),
            "carbs": round(max(0, float(nutrients[3])), 1)
        }

analyzer = FoodAnalyzer()

def _load_model():
    base_path = "food-calorie-estimator/checkpoints"
    m_path = os.path.join(base_path, "best_model.pth")
    n_path = os.path.join(base_path, "normalizer.npy")
    if os.path.exists(m_path) and os.path.exists(n_path):
        analyzer.initialize(m_path, n_path)

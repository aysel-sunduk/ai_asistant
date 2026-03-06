"""
+----------------------------------------------------------------------+
|         HIBRIT YEMEK KALORI TAHMIN PIPELINE                          |
|                                                                      |
|  DATASETLER:                                                         |
|  1. Turk Yemekleri  -> nefisyemektarifleri.com scraper (~375 MB)     |
|  2. Food-101        -> Kaggle (~5 GB, 101 kategori)                  |
|  3. Nutrition5k     -> Google Drive (~2.5 GB, gercek kalori verileri)|
|                                                                      |
|  MODEL: EfficientNetV2-S + Multi-task Regression Head               |
|  CIKTI: Kalori + Protein + Yag + Karbonhidrat tahmini               |
|                                                                      |
|  KURULUM:                                                            |
|  pip install torch torchvision requests beautifulsoup4               |
|              pillow tqdm matplotlib scikit-learn pandas kaggle       |
+----------------------------------------------------------------------+

KULLANIM:
  python hybrid_food_pipeline.py --step all        # Her şeyi çalıştır
  python hybrid_food_pipeline.py --step scrape     # Sadece Türk yemeği scraping
  python hybrid_food_pipeline.py --step download   # Sadece dataset indirme
  python hybrid_food_pipeline.py --step train      # Sadece eğitim
  python hybrid_food_pipeline.py --step predict --image yemek.jpg
"""

# ======================================================================
# IMPORTS
# ======================================================================

import os, re, csv, json, time, random, argparse, subprocess
import requests
import numpy as np
import matplotlib.pyplot as plt

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
from torchvision.models import efficientnet_v2_s, EfficientNet_V2_S_Weights
from PIL import Image
from io import BytesIO
from tqdm import tqdm
from urllib.parse import quote
from sklearn.model_selection import train_test_split
from bs4 import BeautifulSoup
import sys
import io

# Windows'da Türkçe karakter sorunlarını (UnicodeEncodeError) önlemek için
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


# ======================================================================
# GENEL KONFİGÜRASYON
# ======================================================================

CONFIG = {
    # ---- Dataset Yolları ----
    "food101_dir":      "datasets/food101",        # Kaggle'dan indirilecek
    "nutrition5k_dir":  "datasets/nutrition5k",        # Manuel indirilecek
    "turkish_dir":      "datasets/turkish_foods",      # Scraper oluşturacak

    # ---- Scraper ----
    "images_per_food":  50,       # Her Türk yemeği için kaç fotoğraf
    "min_img_size":     150,      # Minimum piksel

    # ---- Food-101 ----
    "max_per_class":    300,      # Food-101'den sınıf başına max görüntü

    # ---- Model ----
    "img_size":         224,
    "dropout":          0.3,

    # ---- Eğitim ----
    "epochs":           50,
    "batch_size":       16,       # Hafıza sorunları için 32'den 16'ya düşürüldü
    "lr":               1e-4,
    "weight_decay":     1e-4,
    "patience":         10,
    "num_workers":      0,        # Windows=0, Linux/Mac=4

    # ---- Kayıt ----
    "save_dir":         "checkpoints",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
}

# ======================================================================
# BÖLÜM 1 — TÜRK YEMEKLERİ SCRAPER
# ======================================================================

TURKISH_FOODS = [
    # (site-slug, arama-sorgusu)
    ("karniyarik",           "karnıyarık"),
    ("kofte",                "köfte"),
    ("iskender",             "iskender kebap"),
    ("adana-kebap",          "adana kebap"),
    ("lahmacun",             "lahmacun"),
    ("pide",                 "pide"),
    ("manti",                "mantı"),
    ("dolma",                "yaprak dolma"),
    ("sarma",                "lahana sarması"),
    ("imam-bayildi",         "imam bayıldı"),
    ("musakka",              "musakka"),
    ("kuru-fasulye",         "kuru fasulye"),
    ("mercimek-yemegi",      "mercimek yemeği"),
    ("mercimek-corbasi",     "mercimek çorbası"),
    ("ezogelin-corbasi",     "ezogelin çorbası"),
    ("tarhana-corbasi",      "tarhana çorbası"),
    ("yayla-corbasi",        "yayla çorbası"),
    ("pilav",                "pirinç pilavı"),
    ("bulgur-pilavi",        "bulgur pilavı"),
    ("menemen",              "menemen"),
    ("borek",                "börek"),
    ("gozleme",              "gözleme"),
    ("poaca",                "poğaça"),
    ("simit",                "simit"),
    ("baklava",              "baklava"),
    ("sutlac",               "sütlaç"),
    ("kazandibi",            "kazandibi"),
    ("kunefe",               "künefe"),
    ("tulumba",              "tulumba tatlısı"),
    ("kisir",                "kısır"),
    ("cacik",                "cacık"),
    ("haydari",              "haydari"),
    ("coban-salatasi",       "çoban salatası"),
    ("ayran",                "ayran"),
    ("turk-kahvesi",         "Türk kahvesi"),
    ("cay",                  "Türk çayı"),
    ("etli-nohut",           "etli nohut"),
    ("ic-pilav",             "iç pilav"),
    ("sucuklu-yumurta",      "sucuklu yumurta"),
    ("patates-kizartmasi",   "patates kızartması"),
    ("tavuk-sote",           "tavuk sote"),
    ("sebze-corbasi",        "sebze çorbası"),
    ("tost",                 "tost"),
    ("durum",                "dürüm"),
    ("doner",                "döner"),
    ("patlican-kebap",       "patlıcan kebap"),
    ("tavuk-sis",            "tavuk şiş"),
    ("kuzu-tandır",          "kuzu tandır"),
    ("balik-ekmek",          "balık ekmek"),
    ("asure",                "aşure"),
    ("cig-kofte",            "çiğ köfte"),
    ("icli-kofte",           "içli köfte"),
    ("hunkar-begendi",       "hünkârbeğendi"),
    ("taze-fasulye",         "taze fasulye"),
    ("bamya",                "bamya yemeği"),
    ("turbe",                "türlü yemeği"),
    ("enginar",              "zeytinyağlı enginar"),
    ("barbunya-pilaki",      "barbunya pilaki"),
    ("saksuka",              "şakşuka"),
    ("mucver",               "mücver"),
    ("arnavut-cigeri",       "arnavut ciğeri"),
    ("kadinbudu-kofte",      "kadınbudu köfte"),
    ("sulu-kofte",           "sulu köfte"),
    ("izmir-kofte",          "izmir köfte"),
    ("beyti",                "beyti kebap"),
    ("cag-kebabi",           "cağ kebabı"),
    ("tantuni",              "tantuni"),
    ("tas-kebabi",           "tas kebabı"),
    ("orman-kebabi",         "orman kebabı"),
    ("ali-nazik",            "ali nazik kebabı"),
    ("kelle-paca",           "kelle paça çorbası"),
    ("iskembe-corbasi",      "işkembe çorbası"),
    ("beyran",               "beyran çorbası"),
    ("domates-corbasi",      "domates çorbası"),
    ("sehriye-corbasi",      "şehriye çorbası"),
    ("revani",               "revani"),
    ("kemalpasa",            "kemalpaşa tatlısı"),
    ("sekerpare",            "şekerpare"),
    ("irmik-helvasi",        "irmik helvası"),
    ("un-helvasi",           "un helvası"),
    ("kabak-tatlisi",        "kabak tatlısı"),
    ("ayva-tatlisi",         "ayva tatlısı"),
    ("gullac",               "güllaç"),
    ("lokum",                "Türk lokumu"),
    ("helva",                "tahin helvası"),
    ("acma",                 "açma"),
    ("bazlama",              "bazlama"),
    ("yufka",                "yufka ekmeği"),
    ("mismis",               "kayısı tatlısı"),
    ("komposto",             "üzüm kompostosu"),
    ("hosaf",                "kayısı hoşafı"),
    ("serbet",               "osmanlı şerbeti"),
    ("salgam",               "şalgam suyu"),
    ("boza",                 "boza"),
    ("sahlep",               "sahlep"),
    ("ayran-asi",           "ayran aşı çorbası"),
    ("pilic-topkapi",        "piliç topkapı"),
    ("kuzu-kapama",          "kuzu kapama"),
    ("elsiz-kebap",          "tepsi kebabı"),
    ("kagit-kebabi",         "kağıt kebabı"),
    ("karisik-izgara",       "karışık ızgara"),
    ("palamut-izgara",       "palamut ızgara"),
    ("hamsi-tava",           "hamsi tava"),
    ("istavrit-tava",        "istavrit tava"),
    ("lufer-izgara",         "lüfer ızgara"),
    ("karides-guvec",        "karides güveç"),
    ("kalamar-tava",         "kalamar tava"),
    ("midye-tava",           "midye tava"),
    ("midye-dolma",          "midye dolma"),
    ("kokorec",              "kokoreç"),
    ("kumpir",               "kumpir"),
    ("islak-hamburger",      "ıslak hamburger"),
    ("sucuk-ekmek",          "sucuk ekmek"),
    ("pazı-sarması",         "pazı sarması"),
    ("kabak-dolması",        "kabak dolması"),
    ("biber-dolması",        "biber dolması"),
]

FALLBACK_CALORIES = {
    "karniyarik":          {"calories": 280, "protein": 12, "fat": 18, "carbs": 22},
    "kofte":               {"calories": 250, "protein": 20, "fat": 15, "carbs":  8},
    "iskender":            {"calories": 320, "protein": 22, "fat": 18, "carbs": 20},
    "adana-kebap":         {"calories": 290, "protein": 25, "fat": 18, "carbs":  5},
    "lahmacun":            {"calories": 285, "protein": 14, "fat": 10, "carbs": 35},
    "pide":                {"calories": 310, "protein": 16, "fat": 12, "carbs": 38},
    "manti":               {"calories": 245, "protein": 14, "fat":  9, "carbs": 28},
    "dolma":               {"calories": 190, "protein":  6, "fat": 10, "carbs": 21},
    "sarma":               {"calories": 175, "protein":  7, "fat":  9, "carbs": 18},
    "imam-bayildi":        {"calories": 165, "protein":  3, "fat": 11, "carbs": 15},
    "musakka":             {"calories": 230, "protein": 14, "fat": 14, "carbs": 14},
    "kuru-fasulye":        {"calories": 145, "protein":  9, "fat":  4, "carbs": 19},
    "mercimek-yemegi":     {"calories":  92, "protein":  6, "fat":  2, "carbs": 14},
    "mercimek-corbasi":    {"calories":  92, "protein":  6, "fat":  2, "carbs": 14},
    "ezogelin-corbasi":    {"calories":  88, "protein":  5, "fat":  2, "carbs": 13},
    "tarhana-corbasi":     {"calories":  75, "protein":  4, "fat":  2, "carbs": 11},
    "yayla-corbasi":       {"calories":  80, "protein":  4, "fat":  3, "carbs":  9},
    "pilav":               {"calories": 130, "protein":  3, "fat":  1, "carbs": 28},
    "bulgur-pilavi":       {"calories": 140, "protein":  4, "fat":  2, "carbs": 28},
    "menemen":             {"calories": 177, "protein": 10, "fat": 11, "carbs":  8},
    "borek":               {"calories": 320, "protein": 10, "fat": 18, "carbs": 30},
    "gozleme":             {"calories": 290, "protein":  9, "fat": 14, "carbs": 33},
    "poaca":               {"calories": 310, "protein":  8, "fat": 16, "carbs": 35},
    "simit":               {"calories": 295, "protein":  9, "fat":  5, "carbs": 55},
    "baklava":             {"calories": 428, "protein":  5, "fat": 22, "carbs": 55},
    "sutlac":              {"calories": 150, "protein":  5, "fat":  3, "carbs": 27},
    "kazandibi":           {"calories": 185, "protein":  5, "fat":  4, "carbs": 33},
    "kunefe":              {"calories": 420, "protein":  8, "fat": 20, "carbs": 52},
    "tulumba":             {"calories": 380, "protein":  4, "fat": 18, "carbs": 50},
    "kisir":               {"calories": 120, "protein":  3, "fat":  4, "carbs": 19},
    "cacik":               {"calories":  62, "protein":  4, "fat":  2, "carbs":  6},
    "haydari":             {"calories":  85, "protein":  5, "fat":  5, "carbs":  5},
    "coban-salatasi":      {"calories":  45, "protein":  2, "fat":  2, "carbs":  6},
    "ayran":               {"calories":  34, "protein":  2, "fat":  1, "carbs":  4},
    "turk-kahvesi":        {"calories":  10, "protein":  0, "fat":  0, "carbs":  1},
    "cay":                 {"calories":   2, "protein":  0, "fat":  0, "carbs":  0},
    "etli-nohut":          {"calories": 160, "protein": 10, "fat":  6, "carbs": 18},
    "ic-pilav":            {"calories": 185, "protein":  5, "fat":  8, "carbs": 24},
    "sucuklu-yumurta":     {"calories": 300, "protein": 16, "fat": 24, "carbs":  3},
    "patates-kizartmasi":  {"calories": 312, "protein":  4, "fat": 15, "carbs": 41},
    "tavuk-sote":          {"calories": 185, "protein": 22, "fat":  9, "carbs":  5},
    "sebze-corbasi":       {"calories":  55, "protein":  2, "fat":  1, "carbs":  9},
    "tost":                {"calories": 280, "protein": 12, "fat": 12, "carbs": 30},
    "durum":               {"calories": 310, "protein": 18, "fat": 12, "carbs": 35},
    "doner":               {"calories": 280, "protein": 20, "fat": 14, "carbs": 18},
    "patlican-kebap":      {"calories": 220, "protein": 18, "fat": 12, "carbs": 10},
    "tavuk-sis":           {"calories": 195, "protein": 28, "fat":  8, "carbs":  2},
    "kuzu-tandır":         {"calories": 290, "protein": 26, "fat": 18, "carbs":  3},
    "balik-ekmek":         {"calories": 340, "protein": 20, "fat": 14, "carbs": 35},
    "asure":               {"calories": 344, "protein":  7, "fat":  2, "carbs": 75},
    "cig-kofte":           {"calories": 180, "protein":  5, "fat":  8, "carbs": 25},
    "icli-kofte":          {"calories": 210, "protein":  9, "fat": 11, "carbs": 22},
    "hunkar-begendi":      {"calories": 250, "protein": 18, "fat": 15, "carbs": 12},
    "taze-fasulye":        {"calories":  75, "protein":  2, "fat":  4, "carbs":  8},
    "bamya":               {"calories":  65, "protein":  2, "fat":  3, "carbs":  9},
    "turbe":               {"calories":  85, "protein":  3, "fat":  4, "carbs": 12},
    "enginar":             {"calories":  92, "protein":  3, "fat":  5, "carbs": 10},
    "barbunya-pilaki":     {"calories": 155, "protein":  7, "fat":  6, "carbs": 22},
    "saksuka":             {"calories": 135, "protein":  2, "fat": 10, "carbs": 12},
    "mucver":              {"calories": 145, "protein":  5, "fat":  8, "carbs": 15},
    "arnavut-cigeri":      {"calories": 280, "protein": 22, "fat": 18, "carbs":  8},
    "kadinbudu-kofte":     {"calories": 240, "protein": 14, "fat": 14, "carbs": 16},
    "sulu-kofte":          {"calories": 185, "protein": 12, "fat":  9, "carbs": 15},
    "izmir-kofte":         {"calories": 230, "protein": 15, "fat": 14, "carbs": 14},
    "beyti":               {"calories": 310, "protein": 20, "fat": 18, "carbs": 18},
    "cag-kebabi":          {"calories": 290, "protein": 24, "fat": 20, "carbs":  2},
    "tantuni":             {"calories": 270, "protein": 18, "fat": 15, "carbs": 20},
    "tas-kebabi":          {"calories": 220, "protein": 22, "fat": 12, "carbs":  6},
    "orman-kebabi":        {"calories": 210, "protein": 20, "fat": 11, "carbs":  9},
    "ali-nazik":           {"calories": 245, "protein": 19, "fat": 16, "carbs":  8},
    "kelle-paca":          {"calories": 135, "protein": 15, "fat":  8, "carbs":  2},
    "iskembe-corbasi":     {"calories": 120, "protein": 12, "fat":  7, "carbs":  3},
    "beyran":              {"calories": 165, "protein": 18, "fat":  9, "carbs":  5},
    "domates-corbasi":     {"calories":  70, "protein":  2, "fat":  4, "carbs":  8},
    "sehriye-corbasi":     {"calories":  65, "protein":  2, "fat":  2, "carbs": 11},
    "revani":              {"calories": 350, "protein":  6, "fat": 15, "carbs": 55},
    "kemalpasa":           {"calories": 320, "protein":  5, "fat": 12, "carbs": 52},
    "sekerpare":           {"calories": 380, "protein":  5, "fat": 18, "carbs": 55},
    "irmik-helvasi":       {"calories": 410, "protein":  6, "fat": 22, "carbs": 55},
    "un-helvasi":          {"calories": 420, "protein":  4, "fat": 24, "carbs": 52},
    "kabak-tatlisi":       {"calories": 185, "protein":  1, "fat":  0, "carbs": 48},
    "ayva-tatlisi":        {"calories": 210, "protein":  1, "fat":  0, "carbs": 54},
    "gullac":              {"calories": 235, "protein":  6, "fat":  8, "carbs": 38},
    "lokum":               {"calories": 360, "protein":  0, "fat":  0, "carbs": 89},
    "helva":               {"calories": 520, "protein": 12, "fat": 32, "carbs": 48},
    "acma":                {"calories": 340, "protein":  7, "fat": 18, "carbs": 42},
    "bazlama":             {"calories": 260, "protein":  8, "fat":  2, "carbs": 55},
    "yufka":               {"calories": 280, "protein":  8, "fat":  1, "carbs": 62},
    "mismis":              {"calories": 150, "protein":  2, "fat":  0, "carbs": 38},
    "komposto":            {"calories":  85, "protein":  0, "fat":  0, "carbs": 22},
    "hosaf":               {"calories":  92, "protein":  0, "fat":  0, "carbs": 24},
    "serbet":              {"calories":  60, "protein":  0, "fat":  0, "carbs": 15},
    "salgam":              {"calories":   5, "protein":  0, "fat":  0, "carbs":  1},
    "boza":                {"calories": 125, "protein":  2, "fat":  0, "carbs": 30},
    "sahlep":              {"calories": 185, "protein":  4, "fat":  6, "carbs": 32},
    "ayran-asi":           {"calories":  75, "protein":  4, "fat":  3, "carbs":  9},
    "pilic-topkapi":       {"calories": 320, "protein": 24, "fat": 18, "carbs": 15},
    "kuzu-kapama":         {"calories": 285, "protein": 22, "fat": 18, "carbs":  8},
    "elsiz-kebap":         {"calories": 240, "protein": 18, "fat": 16, "carbs":  6},
    "kagit-kebabi":        {"calories": 225, "protein": 20, "fat": 14, "carbs":  5},
    "karisik-izgara":      {"calories": 350, "protein": 35, "fat": 22, "carbs":  2},
    "palamut-izgara":      {"calories": 190, "protein": 22, "fat": 11, "carbs":  0},
    "hamsi-tava":          {"calories": 260, "protein": 18, "fat": 16, "carbs": 12},
    "istavrit-tava":       {"calories": 240, "protein": 18, "fat": 14, "carbs": 11},
    "lufer-izgara":        {"calories": 185, "protein": 24, "fat": 10, "carbs":  0},
    "karides-guvec":       {"calories": 145, "protein": 18, "fat":  7, "carbs":  4},
    "kalamar-tava":        {"calories": 280, "protein": 15, "fat": 18, "carbs": 22},
    "midye-tava":          {"calories": 310, "protein": 12, "fat": 20, "carbs": 25},
    "midye-dolma":         {"calories":  85, "protein":  4, "fat":  2, "carbs": 14},
    "kokorec":             {"calories": 295, "protein": 18, "fat": 24, "carbs":  2},
    "kumpir":              {"calories": 450, "protein": 12, "fat": 22, "carbs": 55},
    "islak-hamburger":     {"calories": 285, "protein": 14, "fat": 14, "carbs": 28},
    "sucuk-ekmek":         {"calories": 420, "protein": 18, "fat": 28, "carbs": 35},
    "pazı-sarması":        {"calories": 165, "protein":  6, "fat":  9, "carbs": 16},
    "kabak-dolması":       {"calories": 145, "protein":  4, "fat":  8, "carbs": 15},
    "biber-dolması":       {"calories": 155, "protein":  5, "fat":  8, "carbs": 18},
}

FOOD101_CALORIES = {
    "apple_pie": 237, "baby_back_ribs": 290, "baklava": 428, "beef_carpaccio": 135,
    "beef_tartare": 196, "beet_salad": 74, "beignets": 320, "bibimbap": 168,
    "bread_pudding": 153, "breakfast_burrito": 168, "bruschetta": 193, "caesar_salad": 80,
    "cannoli": 297, "caprese_salad": 130, "carrot_cake": 415, "ceviche": 96,
    "cheesecake": 321, "cheese_plate": 350, "chicken_curry": 150, "chicken_quesadilla": 215,
    "chicken_wings": 290, "chocolate_cake": 371, "chocolate_mousse": 250, "churros": 370,
    "clam_chowder": 121, "club_sandwich": 263, "crab_cakes": 175, "creme_brulee": 291,
    "croque_madame": 280, "cup_cakes": 305, "deviled_eggs": 143, "donuts": 452,
    "dumplings": 152, "edamame": 121, "eggs_benedict": 266, "escargots": 150,
    "falafel": 333, "filet_mignon": 267, "fish_and_chips": 267, "foie_gras": 462,
    "french_fries": 312, "french_onion_soup": 73, "french_toast": 229, "fried_calamari": 175,
    "fried_rice": 163, "frozen_yogurt": 127, "garlic_bread": 350, "gnocchi": 130,
    "greek_salad": 74, "grilled_cheese_sandwich": 350, "grilled_salmon": 206,
    "guacamole": 160, "gyoza": 162, "hamburger": 295, "hot_and_sour_soup": 55,
    "hot_dog": 290, "huevos_rancheros": 175, "hummus": 177, "ice_cream": 207,
    "lasagna": 166, "lobster_bisque": 130, "lobster_roll_sandwich": 270,
    "macaroni_and_cheese": 170, "macarons": 415, "miso_soup": 40, "mussels": 172,
    "nachos": 306, "omelette": 154, "onion_rings": 411, "oysters": 81,
    "pad_thai": 160, "paella": 193, "pancakes": 227, "panna_cotta": 140,
    "peking_duck": 331, "pho": 101, "pizza": 266, "pork_chop": 250,
    "poutine": 289, "prime_rib": 300, "pulled_pork_sandwich": 280, "ramen": 109,
    "ravioli": 200, "red_velvet_cake": 358, "risotto": 166, "samosa": 262,
    "sashimi": 127, "scallops": 111, "seaweed_salad": 45, "shrimp_and_grits": 198,
    "spaghetti_bolognese": 180, "spaghetti_carbonara": 198, "spring_rolls": 200,
    "steak": 271, "strawberry_shortcake": 275, "sushi": 143, "tacos": 216,
    "takoyaki": 190, "tiramisu": 240, "tuna_tartare": 150, "waffles": 291,
}


# ---- Kalori scraper ----

def scrape_calorie(slug):
    url = f"https://www.nefisyemektarifleri.com/kac-kalori/{slug}/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code != 200:
            return None
        text = BeautifulSoup(r.text, "html.parser").get_text()

        cal = None
        for pat in [r'(\d+(?:[.,]\d+)?)\s*kcal', r'(\d+(?:[.,]\d+)?)\s*kalori']:
            for m in re.findall(pat, text, re.IGNORECASE):
                v = float(m.replace(",", "."))
                if 20 <= v <= 2000:
                    cal = v
                    break
            if cal:
                break
        if not cal:
            return None

        def extract(patterns):
            for pat in patterns:
                m = re.search(pat, text, re.IGNORECASE)
                if m:
                    return float(m.group(1).replace(",", "."))
            return None

        protein = extract([r'protein[^\d]*(\d+(?:[.,]\d+)?)', r'(\d+(?:[.,]\d+)?)\s*g[^\d]*protein'])
        fat     = extract([r'yağ[^\d]*(\d+(?:[.,]\d+)?)',     r'(\d+(?:[.,]\d+)?)\s*g[^\d]*yağ'])
        carbs   = extract([r'karbonhidrat[^\d]*(\d+(?:[.,]\d+)?)', r'(\d+(?:[.,]\d+)?)\s*g[^\d]*karbonhidrat'])

        return {
            "calories": cal,
            "protein":  protein or round(cal * 0.15 / 4, 1),
            "fat":      fat     or round(cal * 0.30 / 9, 1),
            "carbs":    carbs   or round(cal * 0.55 / 4, 1),
        }
    except Exception:
        return None


# ---- Fotoğraf indirici ----

def download_images_bing(query, save_dir, n=50):
    os.makedirs(save_dir, exist_ok=True)
    downloaded = len([f for f in os.listdir(save_dir) if f.endswith(".jpg")])
    if downloaded >= n:
        return downloaded

    offset = 0
    pbar = tqdm(total=n - downloaded, desc=f"    📸 {query[:25]}", leave=False)

    while downloaded < n and offset <= 180:
        try:
            url = (f"https://www.bing.com/images/search"
                   f"?q={quote(query + ' yemek tabak')}&count=35&offset={offset}")
            r = requests.get(url, headers=HEADERS, timeout=12)
            soup = BeautifulSoup(r.text, "html.parser")

            img_urls = []
            for tag in soup.find_all("a", class_="iusc"):
                try:
                    img_urls.append(json.loads(tag.get("m", "{}")).get("murl", ""))
                except Exception:
                    pass
            if not img_urls:
                for img in soup.find_all("img"):
                    src = img.get("src", "") or img.get("data-src", "")
                    if src.startswith("http"):
                        img_urls.append(src)

            for img_url in img_urls:
                if downloaded >= n or not img_url:
                    break
                try:
                    ir = requests.get(img_url, headers=HEADERS, timeout=8)
                    img = Image.open(BytesIO(ir.content)).convert("RGB")
                    if img.width < CONFIG["min_img_size"] or img.height < CONFIG["min_img_size"]:
                        continue
                    ar = img.width / img.height
                    if ar < 0.4 or ar > 3.5:
                        continue
                    img.save(os.path.join(save_dir, f"{downloaded:04d}.jpg"), "JPEG", quality=88)
                    downloaded += 1
                    pbar.update(1)
                except Exception:
                    pass
                time.sleep(random.uniform(0.2, 0.6))

            offset += 35
            time.sleep(random.uniform(0.8, 1.5))
        except Exception:
            break

    pbar.close()
    return downloaded


def download_images_ddg(query, save_dir, n=50):
    """DuckDuckGo fallback"""
    os.makedirs(save_dir, exist_ok=True)
    downloaded = len([f for f in os.listdir(save_dir) if f.endswith(".jpg")])
    if downloaded >= n:
        return downloaded

    try:
        tr = requests.get(f"https://duckduckgo.com/?q={quote(query)}&iax=images&ia=images",
                          headers=HEADERS, timeout=10)
        tm = re.search(r'vqd=([\d-]+)', tr.text)
        if not tm:
            return downloaded
        vqd = tm.group(1)

        ar = requests.get("https://duckduckgo.com/i.js",
                          params={"l": "tr-tr", "o": "json", "q": query,
                                  "vqd": vqd, "f": ",,,,,", "p": "1"},
                          headers=HEADERS, timeout=12)
        results = ar.json().get("results", [])

        for item in results:
            if downloaded >= n:
                break
            try:
                ir = requests.get(item.get("image", ""), headers=HEADERS, timeout=8)
                img = Image.open(BytesIO(ir.content)).convert("RGB")
                if img.width < CONFIG["min_img_size"]:
                    continue
                img.save(os.path.join(save_dir, f"{downloaded:04d}.jpg"), "JPEG", quality=88)
                downloaded += 1
            except Exception:
                pass
            time.sleep(random.uniform(0.2, 0.5))
    except Exception:
        pass

    return downloaded


# ---- Ana scraping fonksiyonu ----

def run_turkish_scraper():
    print("\n" + "=" * 65)
    print("TR  TURK YEMEKLERI SCRAPING BASLIYOR")
    print(f"     {len(TURKISH_FOODS)} yemek x {CONFIG['images_per_food']} fotograf")
    print("=" * 65)

    images_dir = os.path.join(CONFIG["turkish_dir"], "images")
    labels_file = os.path.join(CONFIG["turkish_dir"], "labels.json")
    log_file    = os.path.join(CONFIG["turkish_dir"], "scraping_log.json")
    os.makedirs(images_dir, exist_ok=True)

    labels = json.load(open(labels_file, encoding="utf-8")) if os.path.exists(labels_file) else {}
    log    = json.load(open(log_file))                      if os.path.exists(log_file)    else {}

    for i, (slug, query) in enumerate(TURKISH_FOODS, 1):
        food_key = slug.replace("-", "_")
        print(f"\n[{i:2d}/{len(TURKISH_FOODS)}] {slug}")

        # Zaten bittiyse atla
        if log.get(slug, {}).get("done"):
            print(f"  ⏭️  Atlandı (zaten tamamlandı)")
            continue

        # --- Kalori ---
        cal_data = scrape_calorie(slug)
        time.sleep(random.uniform(0.8, 1.5))

        if not cal_data:
            fallback = FALLBACK_CALORIES.get(slug)
            cal_data = fallback if fallback else {"calories": 200, "protein": 8, "fat": 7, "carbs": 25}
            print(f"  ℹ️  Fallback kalori: {cal_data['calories']} kcal")
        else:
            print(f"  ✅ Kalori: {cal_data['calories']} kcal  "
                  f"P:{cal_data['protein']:.0f}g  "
                  f"F:{cal_data['fat']:.0f}g  "
                  f"C:{cal_data['carbs']:.0f}g")

        labels[food_key] = {**cal_data, "label": food_key, "query": query}

        # --- Fotoğraflar ---
        img_dir = os.path.join(images_dir, food_key)
        n = CONFIG["images_per_food"]
        count = download_images_bing(query, img_dir, n)
        if count < n // 2:
            print(f"  🔄 DuckDuckGo fallback...")
            count = download_images_ddg(query, img_dir, n)
        print(f"  📸 {count} fotoğraf")

        log[slug] = {"done": True, "calories": cal_data["calories"], "images": count}

        # Her adımda kaydet
        with open(labels_file, "w", encoding="utf-8") as f:
            json.dump(labels, f, ensure_ascii=False, indent=2)
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(log, f, ensure_ascii=False, indent=2)

        time.sleep(random.uniform(1.0, 2.0))

    total_imgs = sum(
        len([f for f in os.listdir(os.path.join(images_dir, d)) if f.endswith(".jpg")])
        for d in os.listdir(images_dir) if os.path.isdir(os.path.join(images_dir, d))
    )
    print(f"\n✅ Türk yemekleri tamamlandı: {len(labels)} kategori | {total_imgs} fotoğraf")
    return labels


# ======================================================================
# BÖLÜM 2 — DATASET İNDİRME REHBERİ
# ======================================================================

def print_download_guide():
    print("\n" + "═" * 65)
    print("📥  DATASET İNDİRME REHBERİ")
    print("═" * 65)

    print("""
┌─────────────────────────────────────────────────────────────┐
│  ADIM 1 — FOOD-101 (Kaggle, ~5 GB)                         │
├─────────────────────────────────────────────────────────────┤
│  1. https://www.kaggle.com/settings → API → Create Token   │
│  2. kaggle.json'ı indir ve şuraya koy:                      │
│     Windows : C:/Users/KULLANICI/.kaggle/kaggle.json        │
│     Linux   : ~/.kaggle/kaggle.json                         │
│  3. Terminalde çalıştır:                                    │
│     pip install kaggle                                      │
│     kaggle datasets download -d dansbecker/food-101 \\      │
│       -p datasets/food101 --unzip                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ADIM 2 — NUTRİTION5K (Google Drive, ~2.5 GB)              │
├─────────────────────────────────────────────────────────────┤
│  1. github.com/google-research-datasets/Nutrition5k         │
│  2. Sadece şu klasörleri indir (video İNDİRME = 190 GB!):  │
│     ✅ imagery/realsense_overhead/  (~2.5 GB)               │
│     ✅ metadata/dish_metadata_cafe1.csv                     │
│     ✅ metadata/dish_metadata_cafe2.csv                     │
│  3. datasets/nutrition5k/ klasörüne çıkart                  │
└─────────────────────────────────────────────────────────────┘

⏭️  İndirme yapmak istemiyorsan sadece Türk yemekleri + demo
    ile de devam edebilirsin. --step train ile başlat.
""")


# ======================================================================
# BÖLÜM 3 — VERİ YÜKLEME & BİRLEŞTİRME
# ======================================================================

def load_turkish_foods():
    labels_file = os.path.join(CONFIG["turkish_dir"], "labels.json")
    images_dir  = os.path.join(CONFIG["turkish_dir"], "images")

    if not os.path.exists(labels_file):
        print("  ⚠️  Türk yemekleri bulunamadı. Önce --step scrape çalıştır.")
        return []

    labels = json.load(open(labels_file, encoding="utf-8"))
    data = []
    for food_key, info in labels.items():
        img_dir = os.path.join(images_dir, food_key)
        if not os.path.exists(img_dir):
            continue
        for fname in os.listdir(img_dir):
            if not fname.endswith(".jpg"):
                continue
            data.append({
                "image_path": os.path.join(img_dir, fname),
                "calories":   float(info["calories"]),
                "protein":    float(info.get("protein", info["calories"] * 0.15 / 4)),
                "fat":        float(info.get("fat",     info["calories"] * 0.30 / 9)),
                "carbs":      float(info.get("carbs",   info["calories"] * 0.55 / 4)),
                "source":     "turkish",
                "label":      food_key,
            })
    print(f"  ✅ Türk yemekleri : {len(data):,} örnek")
    return data


def load_food101():
    base = CONFIG["food101_dir"]
    
    # Desteklenen klasör yapıları (images veya train/validation)
    possible_dirs = ["images", "train", "validation"]
    images_dirs = [os.path.join(base, d) for d in possible_dirs if os.path.exists(os.path.join(base, d))]
    
    if not images_dirs:
        print(f"  ⚠️  Food-101 alt klasörleri bulunamadı (images, train veya validation): {base}")
        return []

    data = []
    found_categories = set()
    
    for img_dir in images_dirs:
        categories = [d for d in os.listdir(img_dir)
                      if os.path.isdir(os.path.join(img_dir, d))]
        for cat in categories:
            found_categories.add(cat)
            cal = FOOD101_CALORIES.get(cat, 250)
            cat_dir = os.path.join(img_dir, cat)
            
            # Bellek koruması için her klasörden sınırlı sayıda al
            all_imgs = [f for f in os.listdir(cat_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
            selected_imgs = all_imgs[:CONFIG["max_per_class"]]
            
            for fname in selected_imgs:
                data.append({
                    "image_path": os.path.join(cat_dir, fname),
                    "calories":   float(cal),
                    "protein":    float(cal * 0.15 / 4),
                    "fat":        float(cal * 0.30 / 9),
                    "carbs":      float(cal * 0.55 / 4),
                    "source":     "food101",
                    "label":      cat,
                })
    
    print(f"  ✅ Food-101       : {len(data):,} örnek ({len(found_categories)} farklı kategori)")
    return data


def load_nutrition5k():
    base         = CONFIG["nutrition5k_dir"]
    imagery_dir  = os.path.join(base, "imagery", "realsense_overhead")
    metadata_dir = os.path.join(base, "metadata")

    if not os.path.exists(metadata_dir):
        print(f"  ⚠️  Nutrition5k bulunamadı: {metadata_dir}")
        return []

    data = []
    for fname in ["dish_metadata_cafe1.csv", "dish_metadata_cafe2.csv"]:
        fpath = os.path.join(metadata_dir, fname)
        if not os.path.exists(fpath):
            continue
        with open(fpath) as f:
            for row in csv.DictReader(f):
                img_path = os.path.join(imagery_dir, row.get("dish_id", ""), "rgb.png")
                if not os.path.exists(img_path):
                    continue
                try:
                    data.append({
                        "image_path": img_path,
                        "calories":   float(row["total_calories"]),
                        "protein":    float(row["total_protein"]),
                        "fat":        float(row["total_fat"]),
                        "carbs":      float(row["total_carbs"]),
                        "source":     "nutrition5k",
                        "label":      row.get("dish_id", ""),
                    })
                except (ValueError, KeyError):
                    pass
    print(f"  ✅ Nutrition5k    : {len(data):,} örnek")
    return data


def create_demo_data(n=300):
    os.makedirs("datasets/demo_images", exist_ok=True)
    data = []
    for i in range(n):
        p = f"datasets/demo_images/food_{i:04d}.jpg"
        Image.fromarray(np.random.randint(50, 200, (224, 224, 3), dtype=np.uint8)).save(p)
        cal = float(np.random.uniform(80, 800))
        data.append({"image_path": p, "calories": cal,
                     "protein": cal*0.15/4, "fat": cal*0.30/9, "carbs": cal*0.55/4,
                     "source": "demo", "label": f"food_{i}"})
    print(f"  ✅ Demo           : {n} örnek (test için)")
    return data


def merge_all_datasets():
    print("\n" + "═" * 65)
    print("🔗  DATASETLER BİRLEŞTİRİLİYOR")
    print("═" * 65)

    all_data = []
    all_data += load_turkish_foods()
    all_data += load_food101()
    all_data += load_nutrition5k()

    if not all_data:
        print("\n  ⚠️  Hiç dataset bulunamadı — Demo moda geçiliyor...")
        all_data = create_demo_data(300)

    # İstatistikler
    from collections import Counter
    sources = Counter(d["source"] for d in all_data)
    cals    = [d["calories"] for d in all_data]

    print(f"\n  {'KAYNAK':<15} {'ÖRNEK':>8}")
    print("  " + "-" * 25)
    for src, cnt in sources.items():
        bar = "█" * (cnt // max(1, max(sources.values()) // 20))
        print(f"  {src:<15} {cnt:>8,}  {bar}")
    print("  " + "-" * 25)
    print(f"  {'TOPLAM':<15} {len(all_data):>8,}")
    print(f"\n  Kalori ort : {np.mean(cals):.0f} kcal")
    print(f"  Kalori min : {np.min(cals):.0f} kcal")
    print(f"  Kalori max : {np.max(cals):.0f} kcal")

    return all_data


# ======================================================================
# BÖLÜM 4 — PYTORCH DATASET
# ======================================================================

class FoodDataset(Dataset):
    def __init__(self, data, transform=None, label_to_idx=None):
        self.data      = data
        self.transform = transform
        self.label_to_idx = label_to_idx or {}

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        try:
            img = Image.open(item["image_path"]).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), (120, 80, 60))
        if self.transform:
            img = self.transform(img)
            
        targets = torch.tensor(
            [item["calories"], item["protein"], item["fat"], item["carbs"]],
            dtype=torch.float32
        )
        
        # Sınıf etiketi (Category index)
        label_str = item.get("label", "unknown")
        label_idx = self.label_to_idx.get(label_str, 0)
        
        return img, targets, torch.tensor(label_idx, dtype=torch.long)


def get_transforms():
    train = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.3, 0.3, 0.3, 0.1),
        transforms.RandomRotation(15),
        transforms.RandomGrayscale(p=0.02),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return train, val


# ======================================================================
# BÖLÜM 5 — MODEL
# ======================================================================

class CalorieModel(nn.Module):
    def __init__(self, num_classes=150, pretrained=True, dropout=0.3):
        super().__init__()
        weights      = EfficientNet_V2_S_Weights.IMAGENET1K_V1 if pretrained else None
        base         = efficientnet_v2_s(weights=weights)
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


# ======================================================================
# BÖLÜM 6 — NORMALİZER
# ======================================================================

class Normalizer:
    def __init__(self):
        self.mean = self.std = None

    def fit(self, arr):
        self.mean = arr.mean(0)
        self.std  = arr.std(0) + 1e-8

    def normalize(self, x):
        return (x - self.mean) / self.std

    def denormalize(self, x):
        return x * self.std + self.mean

    def save(self, path):
        np.save(path, {"mean": self.mean, "std": self.std}, allow_pickle=True)

    def load(self, path):
        d = np.load(path, allow_pickle=True).item()
        self.mean, self.std = d["mean"], d["std"]


# ======================================================================
# BÖLÜM 7 — EĞİTİM YARDIMCILARI (Mixup vb.)
# ======================================================================

def mixup_data(x, y, alpha=0.2, device='cpu'):
    '''Returns mixed inputs, pairs of targets, and lambda'''
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1

    batch_size = x.size()[0]
    index = torch.randperm(batch_size).to(device)

    mixed_x = lam * x + (1 - lam) * x[index, :]
    y_a, y_b = y, y[index]
    return mixed_x, y_a, y_b, lam

def mixup_criterion(criterion, pred, y_a, y_b, lam):
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)

# ======================================================================
# BÖLÜM 8 — EĞİTİM
# ======================================================================

def train_epoch(model, loader, opt, criterion, device, norm, use_mixup=True):
    model.train()
    total = 0
    for imgs, targets in tqdm(loader, desc="  Train", leave=False):
        imgs = imgs.to(device)
        targets = targets.cpu().numpy()
    total_loss = 0
    ce_loss_fn = nn.CrossEntropyLoss()
    
    pbar = tqdm(loader, desc="  Train", leave=False)
    for imgs, targets, labels in pbar:
        imgs, targets, labels = imgs.to(device), targets.to(device), labels.to(device)
        
        opt.zero_grad()
        reg_out, cls_out = model(imgs)
        
        # Regression kaybı (Huber)
        loss_reg = criterion(reg_out, norm.norm(targets))
        
        # Classification kaybı (CrossEntropy)
        loss_cls = ce_loss_fn(cls_out, labels)
        
        # Hibrit kayıp (Ağırlıklı birleştirme)
        loss = loss_reg + 0.3 * loss_cls
        
        loss.backward()
        opt.step()
        
        total_loss += loss.item()
        pbar.set_postfix({"L": f"{loss.item():.4f}"})
        
    return total_loss / len(loader)


def eval_epoch(model, loader, criterion, device, norm):
    model.eval()
    total_loss = 0
    mae_sum = np.zeros(4)
    mape_sum = np.zeros(4)
    ce_loss_fn = nn.CrossEntropyLoss()
    
    with torch.no_grad():
        for imgs, targets, labels in loader:
            imgs, targets, labels = imgs.to(device), targets.to(device), labels.to(device)
            reg_out, cls_out = model(imgs)
            
            # Kayıp hesaplama
            loss_reg = criterion(reg_out, norm.normalize(targets))
            loss_cls = ce_loss_fn(cls_out, labels)
            loss = loss_reg + 0.3 * loss_cls
            total_loss += loss.item()

            preds = norm.denormalize(reg_out)
            mae_sum += torch.abs(preds - targets).mean(dim=0).cpu().numpy()
            mape_sum += (torch.abs(preds - targets) / (targets + 1e-6)).mean(dim=0).cpu().numpy() * 100
            
    return {
        "loss": total_loss / len(loader),
        "mae":  mae_sum / len(loader),
        "mape": mape_sum / len(loader)
    }


def run_training():
    print("\n" + "═" * 65)
    print("🚀  EĞİTİM BAŞLIYOR")
    print("═" * 65)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Cihaz : {device}")
    if device.type == "cuda":
        print(f"  GPU   : {torch.cuda.get_device_name(0)}")

    # Veri
    all_data = merge_all_datasets()
    
    # Label mapping (Multi-task için)
    unique_labels = sorted(list(set(d["label"] for d in all_data)))
    label_to_idx  = {lbl: i for i, lbl in enumerate(unique_labels)}
    idx_to_label  = {i: lbl for lbl, i in label_to_idx.items()}
    num_classes   = len(unique_labels)
    print(f"  Kategoriler : {num_classes} farklı yemek türü")

    train_d, tmp    = train_test_split(all_data, test_size=0.20, random_state=42)
    val_d,   test_d = train_test_split(tmp,       test_size=0.50, random_state=42)
    print(f"\n  Train: {len(train_d):,}  Val: {len(val_d):,}  Test: {len(test_d):,}")

    # Normalizer
    norm = Normalizer()
    norm.fit(np.array([[d["calories"], d["protein"], d["fat"], d["carbs"]]
                        for d in train_d]))

    # DataLoaders
    train_tf, val_tf = get_transforms()
    bs, nw = CONFIG["batch_size"], CONFIG["num_workers"]

    train_loader = DataLoader(FoodDataset(train_d, train_tf, label_to_idx),
                              batch_size=bs, shuffle=True,  num_workers=nw, pin_memory=True)
    val_loader   = DataLoader(FoodDataset(val_d,   val_tf, label_to_idx),
                              batch_size=bs, shuffle=False, num_workers=nw)
    test_loader  = DataLoader(FoodDataset(test_d,  val_tf, label_to_idx),
                              batch_size=bs, shuffle=False)

    # Model
    model     = CalorieModel(num_classes=num_classes, pretrained=True, dropout=CONFIG["dropout"]).to(device)
    optimizer = optim.AdamW(model.parameters(),
                            lr=CONFIG["lr"], weight_decay=CONFIG["weight_decay"])
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
                    optimizer, T_max=CONFIG["epochs"])
    criterion = nn.HuberLoss(delta=1.0)

    params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Model : EfficientNetV2-S | {params:,} parametre")

    os.makedirs(CONFIG["save_dir"], exist_ok=True)
    best, patience_cnt = float("inf"), 0
    history = {"tloss": [], "vloss": [], "mae_cal": [], "mape_cal": []}
    start_epoch = 1

    # Resume Kontrolü
    checkpoint_path = f"{CONFIG['save_dir']}/best_model.pth"
    if os.path.exists(checkpoint_path):
        print(f"\n  🔄 Mevcut checkpoint yukleniyor: {checkpoint_path}")
        try:
            ckpt = torch.load(checkpoint_path, map_location=device)
            # Label mapping uyuşmazlığı kontrolü (opsiyonel)
            model.load_state_dict(ckpt["state"])
            if "epoch" in ckpt:
                start_epoch = ckpt["epoch"] + 1
                print(f"  ✅ Egitim epoch {ckpt['epoch']} yilindan devam ediyor.")
            if "val_loss" in ckpt:
                best = ckpt["val_loss"]
        except Exception as e:
            print(f"  ⚠️ Checkpoint yuklenemedi, bastan baslaniyor: {e}")

    print(f"\n  {'Ep':>4}  {'TLoss':>8}  {'VLoss':>8}  "
          f"{'CalMAE':>8}  {'CalMAPE':>8}")
    print("  " + "-" * 50)

    for ep in range(start_epoch, CONFIG["epochs"] + 1):
        tl  = train_epoch(model, train_loader, optimizer, criterion, device, norm)
        vm  = eval_epoch(model, val_loader, criterion, device, norm)
        scheduler.step()

        history["tloss"].append(tl)
        history["vloss"].append(vm["loss"])
        history["mae_cal"].append(vm["mae"][0])
        history["mape_cal"].append(vm["mape"][0])

        saved = ""
        if vm["loss"] < best:
            best, patience_cnt = vm["loss"], 0
            torch.save({
                "epoch": ep, 
                "state": model.state_dict(),
                "val_loss": best,
                "label_to_idx": label_to_idx,
                "idx_to_label": idx_to_label
            }, f"{CONFIG['save_dir']}/best_model.pth")
            norm.save(f"{CONFIG['save_dir']}/normalizer.npy")
            saved = "  💾"

        print(f"  {ep:>4}  {tl:>8.4f}  {vm['loss']:>8.4f}  "
              f"{vm['mae'][0]:>6.1f} kcal  {vm['mape'][0]:>6.1f}%{saved}")

        patience_cnt += 1
        if patience_cnt >= CONFIG["patience"]:
            print(f"\n  ⏹️  Early stopping ({CONFIG['patience']} epoch iyileşme yok)")
            break

    # Test
    ckpt = torch.load(f"{CONFIG['save_dir']}/best_model.pth", map_location=device)
    model.load_state_dict(ckpt["state"])
    tm = eval_epoch(model, test_loader, criterion, device, norm)

    print("\n" + "═" * 65)
    print("🏁  TEST SONUÇLARI")
    print("═" * 65)
    labels_tr = ["Kalori", "Protein", "Yağ", "Karbonhidrat"]
    units_tr  = ["kcal", "g", "g", "g"]
    for i, (lbl, unit) in enumerate(zip(labels_tr, units_tr)):
        print(f"  {lbl:<15}  MAE: {tm['mae'][i]:6.1f} {unit}  "
              f"MAPE: {tm['mape'][i]:5.1f}%")

    _plot(history, CONFIG["save_dir"])
    return model, norm


def _plot(history, save_dir):
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))
    fig.suptitle("Eğitim Geçmişi", fontsize=13)

    axes[0].plot(history["tloss"], label="Train")
    axes[0].plot(history["vloss"], label="Val")
    axes[0].set_title("Loss"); axes[0].legend()

    axes[1].plot(history["mae_cal"],  color="tomato")
    axes[1].set_title("Kalori MAE (kcal)")

    axes[2].plot(history["mape_cal"], color="seagreen")
    axes[2].set_title("Kalori MAPE (%)")

    for ax in axes:
        ax.set_xlabel("Epoch"); ax.grid(alpha=0.3)

    plt.tight_layout()
    out = os.path.join(save_dir, "training_history.png")
    plt.savefig(out, dpi=120)
    plt.close()
    print(f"\n  📊 Grafik: {out}")


# ======================================================================
# BÖLÜM 8 — INFERENCE
# ======================================================================

class CaloriePredictor:
    """
    Eğitilmiş modeli kullanarak fotoğraftan besin değeri tahmin eder.
    """

    def __init__(self,
                 model_path="checkpoints/best_model.pth",
                 norm_path="checkpoints/normalizer.npy"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        ckpt = torch.load(model_path, map_location=self.device)
        
        self.label_to_idx = ckpt.get("label_to_idx") or ckpt.get("l2i", {})
        self.idx_to_label = ckpt.get("idx_to_label") or ckpt.get("i2l", {})
        
        # Checkpoint'ten kategori sayısını çek (h_cls.weight shape: [num_classes, 256])
        if "h_cls.weight" in ckpt["state"]:
            num_classes = ckpt["state"]["h_cls.weight"].shape[0]
        elif self.label_to_idx:
            num_classes = len(self.label_to_idx)
        else:
            num_classes = 150
        
        self.model = CalorieModel(num_classes=num_classes, pretrained=False)
        self.model.load_state_dict(ckpt["state"])
        self.model.to(self.device).eval()
        self.norm = Normalizer()
        self.norm.load(norm_path)
        self.tf = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    @torch.no_grad()
    def predict(self, image_path):
        img = Image.open(image_path).convert("RGB")
        t   = self.tf(img).unsqueeze(0).to(self.device)
        reg_out, cls_out = self.model(t)
        
        # Regression sonuçları
        nutrients = self.norm.denormalize(reg_out).cpu().numpy()[0]
        
        # Classification sonuçları
        probs = torch.softmax(cls_out, dim=1)
        prob, idx = torch.max(probs, dim=1)
        food_name = self.idx_to_label.get(idx.item(), "Bilinmiyor")
        
        return {
            "food_name":  food_name,
            "confidence": round(float(prob.item()) * 100, 1),
            "calories":   max(0, round(float(nutrients[0]), 1)),
            "protein_g": max(0, round(float(nutrients[1]), 1)),
            "fat_g":     max(0, round(float(nutrients[2]), 1)),
            "carbs_g":   max(0, round(float(nutrients[3]), 1)),
        }

    def predict_and_show(self, image_path):
        result = self.predict(image_path)
        img    = Image.open(image_path)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5))
        ax1.imshow(img); ax1.axis("off")
        ax1.set_title(f"Tahmin: {result['food_name']} ({result['confidence']}%)")

        labels = ["Kalori\n(kcal)", "Protein\n(g)", "Yağ\n(g)", "Karbonhidrat\n(g)"]
        vals   = [result["calories"], result["protein_g"], result["fat_g"], result["carbs_g"]]
        colors = ["#e74c3c", "#2ecc71", "#f39c12", "#3498db"]
        bars   = ax2.bar(labels, vals, color=colors, edgecolor="white", linewidth=1.5)
        for b, v in zip(bars, vals):
            ax2.text(b.get_x() + b.get_width() / 2,
                     b.get_height() + max(vals) * 0.02,
                     str(v), ha="center", fontsize=11, fontweight="bold")
        ax2.set_title("Besin Değerleri"); ax2.grid(axis="y", alpha=0.3)
        plt.tight_layout(); plt.show()

        print("\n🍽️  TAHMİN SONUÇLARI")
        print(f"   🎯 Yemek Türü   : {result['food_name']} (%{result['confidence']})")
        print(f"   🔥 Kalori       : {result['calories']} kcal")
        print(f"   💪 Protein      : {result['protein_g']} g")
        print(f"   🧈 Yağ          : {result['fat_g']} g")
        print(f"   🍞 Karbonhidrat : {result['carbs_g']} g")
        return result


# ======================================================================
# BÖLÜM 9 — ONNX EXPORT (Mobil için)
# ======================================================================

def export_onnx(model_path="checkpoints/best_model.pth",
                out_path="food_calorie_model.onnx"):
    ckpt  = torch.load(model_path, map_location="cpu")
    model = CalorieModel(pretrained=False)
    model.load_state_dict(ckpt["state"])
    model.eval()
    dummy = torch.randn(1, 3, 224, 224)
    torch.onnx.export(model, dummy, out_path,
                      input_names=["image"], output_names=["nutrients"],
                      dynamic_axes={"image": {0: "batch"}, "nutrients": {0: "batch"}},
                      opset_version=11)
    print(f"✅ ONNX: {out_path}  ({os.path.getsize(out_path)/1e6:.1f} MB)")


# ======================================================================
# ANA ÇALIŞTIRICI
# ======================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hibrit Yemek Kalori Pipeline")
    parser.add_argument("--step", default="all",
                        choices=["all", "scrape", "download", "train", "predict", "export"],
                        help="Hangi adım çalıştırılsın")
    parser.add_argument("--image", default=None,
                        help="Tahmin için fotoğraf yolu (--step predict ile)")
    args = parser.parse_args()

    print("""
+--------------------------------------------------------------+
|       HIBRIT YEMEK KALORI TAHMIN SISTEMI                   |
|  Turk Yemekleri + Food-101 + Nutrition5k                    |
+--------------------------------------------------------------+""")

    if args.step in ("all", "download"):
        print_download_guide()
        try:
            import download_datasets
            download_datasets.download_food101()
            # Nutrition5k için manuel onay/indirme gerekebilir
        except ImportError:
            print("  ⚠️  download_datasets.py bulunamadı, otomatik indirme atlanıyor.")

    if args.step in ("all", "scrape"):
        run_turkish_scraper()

    if args.step in ("all", "train"):
        model, norm = run_training()

    if args.step == "predict":
        if not args.image:
            print("❌ --image parametresi gerekli!")
        else:
            p = CaloriePredictor()
            p.predict_and_show(args.image)

    if args.step == "export":
        export_onnx()

    if args.step == "all":
        print("\n" + "═" * 65)
        print("✅  HER ŞEY TAMAMLANDI!")
        print("═" * 65)
        print("""
  Sonraki adımlar:
  ├── Tahmin yap   : python hybrid_food_pipeline.py --step predict --image yemek.jpg
  ├── ONNX export  : python hybrid_food_pipeline.py --step export
  └── Checkpoints  : checkpoints/best_model.pth
        """)

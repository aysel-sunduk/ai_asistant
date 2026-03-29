"""
Diyet Öneri Sistemi — Kaggle Eğitim Notebook'u
================================================
Bu notebook, Food.com Recipes veri setini kullanarak
diyet öneri sistemi için gerekli veri tabanını oluşturur.

═══════════════════════════════════════════════════════════
  KAGGLE'DA DATASET EKLEME TALİMATI:
═══════════════════════════════════════════════════════════

  1. Notebook sağ panelinde "+ Add Input" butonuna tıkla
  2. Arama çubuğunun hemen altındaki sekmelerde
     "All" yerine "Datasets" sekmesine tıkla!
  3. Arama kutusuna şunu yaz:
     food-com-recipes-and-user-interactions
  4. shuyangli94 kullanıcısının dataset'ini seç
  
  Doğrudan li32nk:
  https://www.kaggle.com/datasets/shuyangli94/food-com-recipes-and-user-interactions

═══════════════════════════════════════════════════════════

Çıktılar (Kaggle Output):
  - recipe_database.pkl   → İşlenmiş tarif veritabanı
  - nutrition_scaler.pkl   → Besin değeri normalizer
  - meal_classifier.pkl    → Öğün sınıflandırıcı
"""

# ═══════════════════════════════════════════════════════════════════
# ADIM 0: KURULUM ve İMPORT
# ═══════════════════════════════════════════════════════════════════
import numpy as np
import pandas as pd
import pickle
import json
import re
import os
import glob
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("  Diyet Öneri Sistemi — Eğitim Başlıyor")
print("=" * 60)

# ═══════════════════════════════════════════════════════════════════
# ADIM 1: VERİ YÜKLEME
# ═══════════════════════════════════════════════════════════════════
print("\n📊 Adım 1: Veri yükleniyor...")

# Dataset'i otomatik bul (Kaggle'da path değişebilir)
raw_recipes_file = None

# Olası path'leri dene
possible_paths = [
    "/kaggle/input/food-com-recipes-and-user-interactions/RAW_recipes.csv",
    "/kaggle/input/foodcom-recipes-and-user-interactions/RAW_recipes.csv",
    "/kaggle/input/datasets/shuyangli94/food-com-recipes-and-user-interactions/RAW_recipes.csv",
]

# Recursive glob ile de ara (tüm alt klasörlerde)
glob_results = glob.glob("/kaggle/input/**/RAW_recipes.csv", recursive=True)
possible_paths.extend(glob_results)

for path in possible_paths:
    if os.path.exists(path):
        raw_recipes_file = path
        break

if raw_recipes_file is None:
    # Tüm input dosyalarını listele (debug için)
    print("\n  ❌ RAW_recipes.csv bulunamadı!")
    print("  Mevcut input dosyaları:")
    for root, dirs, files in os.walk("/kaggle/input"):
        for f in files[:20]:
            print(f"    {os.path.join(root, f)}")
    raise FileNotFoundError(
        "Dataset bulunamadı! Lütfen notebook'a 'Food.com Recipes and User Interactions' "
        "dataset'ini ekleyin. Sağ panelde '+ Add Input' > 'Datasets' sekmesi > "
        "'food-com-recipes-and-user-interactions' arayın."
    )

df_recipes = pd.read_csv(raw_recipes_file)
print(f"  ✅ {len(df_recipes):,} tarif yüklendi")
print(f"  Sütunlar: {list(df_recipes.columns)}")

# ═══════════════════════════════════════════════════════════════════
# ADIM 2: BESİN DEĞERLERİNİ AYIKLA
# ═══════════════════════════════════════════════════════════════════
print("\n🔬 Adım 2: Besin değerleri ayrıştırılıyor...")

# nutrition sütunu string formatında list:
# [calories, total fat (PDV), sugar (PDV), sodium (PDV), protein (PDV), saturated fat (PDV), carbohydrates (PDV)]
# PDV = Percent Daily Value

def parse_nutrition(nutrition_str):
    """Nutrition string'ini parse et ve gerçek değerlere dönüştür."""
    try:
        values = json.loads(nutrition_str.replace("'", '"'))
        if len(values) >= 7:
            # PDV -> gram dönüşümü (yaklaşık günlük referans değerler)
            calories = values[0]                    # Zaten kcal
            total_fat_g = values[1] * 78 / 100      # PDV %  -> gram (78g/gün ref)
            sugar_g = values[2] * 50 / 100           # PDV %  -> gram (50g/gün ref)
            sodium_mg = values[3] * 2300 / 100       # PDV %  -> mg (2300mg/gün ref)
            protein_g = values[4] * 50 / 100         # PDV %  -> gram (50g/gün ref)
            sat_fat_g = values[5] * 20 / 100         # PDV %  -> gram (20g/gün ref)
            carbs_g = values[6] * 275 / 100          # PDV %  -> gram (275g/gün ref)
            return pd.Series({
                'calories': calories,
                'protein': protein_g,
                'fat': total_fat_g,
                'carbs': carbs_g,
                'sugar': sugar_g,
                'sodium': sodium_mg,
                'sat_fat': sat_fat_g
            })
    except:
        pass
    return pd.Series({
        'calories': np.nan, 'protein': np.nan, 'fat': np.nan,
        'carbs': np.nan, 'sugar': np.nan, 'sodium': np.nan, 'sat_fat': np.nan
    })


# Nutrition'ı parse et
nutrition_df = df_recipes['nutrition'].apply(parse_nutrition)
df = pd.concat([df_recipes, nutrition_df], axis=1)

print(f"  ✅ Besin değerleri ayrıştırıldı")
print(f"  NaN oranları:")
for col in ['calories', 'protein', 'fat', 'carbs']:
    nan_pct = df[col].isna().mean() * 100
    print(f"    {col}: {nan_pct:.1f}%")

# ═══════════════════════════════════════════════════════════════════
# ADIM 3: VERİ TEMİZLEME ve FİLTRELEME
# ═══════════════════════════════════════════════════════════════════
print("\n🧹 Adım 3: Veri temizleniyor...")

# NaN olanları çıkar
df = df.dropna(subset=['calories', 'protein', 'fat', 'carbs'])
print(f"  NaN temizlemesi sonrası: {len(df):,} tarif")

# Anormal değerleri filtrele (makul aralıklar)
df = df[
    (df['calories'] > 10) & (df['calories'] < 3000) &      # 10-3000 kcal arası
    (df['protein'] >= 0) & (df['protein'] < 200) &          # 0-200g protein
    (df['fat'] >= 0) & (df['fat'] < 200) &                  # 0-200g yağ
    (df['carbs'] >= 0) & (df['carbs'] < 500) &              # 0-500g karbonhidrat
    (df['minutes'] > 0) & (df['minutes'] < 300)             # 5 saat altı tarifler
]
print(f"  Filtre sonrası: {len(df):,} tarif")

# Gerekli sütunları seç
df = df[['name', 'id', 'minutes', 'tags', 'n_steps', 'steps', 'description',
         'ingredients', 'n_ingredients',
         'calories', 'protein', 'fat', 'carbs', 'sugar', 'sodium', 'sat_fat']].copy()

# Tag'leri temizle
df['tags'] = df['tags'].fillna('[]')
df['tags_list'] = df['tags'].apply(lambda x: json.loads(x.replace("'", '"')) if isinstance(x, str) else [])

print(f"  ✅ Temiz veri seti: {len(df):,} tarif")

# ═══════════════════════════════════════════════════════════════════
# ADIM 4: ÖĞÜN TİPİ SINIFLANDIRMA
# ═══════════════════════════════════════════════════════════════════
print("\n🍽️ Adım 4: Öğün tipleri belirleniyor...")

# Tag'lerden öğün tipini çıkar
BREAKFAST_KEYWORDS = [
    'breakfast', 'brunch', 'morning', 'pancake', 'waffle', 'oatmeal',
    'cereal', 'egg', 'eggs', 'bacon', 'toast', 'muffin', 'smoothie',
    'granola', 'yogurt', 'omelet', 'omelette', 'crepe', 'french-toast'
]
LUNCH_KEYWORDS = [
    'lunch', 'salad', 'sandwich', 'soup', 'wrap', 'panini',
    'bowl', 'light-meal', 'quick-lunch'
]
DINNER_KEYWORDS = [
    'dinner', 'main-dish', 'main-course', 'entree', 'roast', 'stew',
    'pasta', 'curry', 'stir-fry', 'casserole', 'grilling', 'bbq',
    'meat', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'lamb'
]
SNACK_KEYWORDS = [
    'snack', 'snacks', 'appetizer', 'appetizers', 'finger-food',
    'dip', 'nuts', 'energy-bar', 'protein-bar', 'trail-mix',
    'fruit', 'healthy-snack'
]

def classify_meal_type(tags_list, calories):
    """Tag'ler ve kalori değerine göre öğün tipini belirle."""
    tags_lower = [t.lower() for t in tags_list]
    tags_str = ' '.join(tags_lower)

    # Önce tag'lere bak
    breakfast_score = sum(1 for kw in BREAKFAST_KEYWORDS if kw in tags_str)
    lunch_score = sum(1 for kw in LUNCH_KEYWORDS if kw in tags_str)
    dinner_score = sum(1 for kw in DINNER_KEYWORDS if kw in tags_str)
    snack_score = sum(1 for kw in SNACK_KEYWORDS if kw in tags_str)

    scores = {
        'BREAKFAST': breakfast_score,
        'LUNCH': lunch_score,
        'DINNER': dinner_score,
        'SNACK': snack_score
    }

    max_score = max(scores.values())
    if max_score > 0:
        return max(scores, key=scores.get)

    # Tag yoksa kaloriye göre tahmin et
    if calories < 150:
        return 'SNACK'
    elif calories < 400:
        return 'BREAKFAST'
    elif calories < 700:
        return 'LUNCH'
    else:
        return 'DINNER'


df['meal_type'] = df.apply(lambda row: classify_meal_type(row['tags_list'], row['calories']), axis=1)

meal_dist = df['meal_type'].value_counts()
print(f"  Öğün dağılımı:")
for meal, count in meal_dist.items():
    print(f"    {meal}: {count:,} tarif ({count/len(df)*100:.1f}%)")

# ═══════════════════════════════════════════════════════════════════
# ADIM 5: DİYET TİPİ ETİKETLEME
# ═══════════════════════════════════════════════════════════════════
print("\n🏷️ Adım 5: Diyet tipleri etiketleniyor...")

def classify_diet_type(tags_list, protein, carbs, fat, calories):
    """Tarife diyet etiketleri ata."""
    tags_str = ' '.join([t.lower() for t in tags_list])
    labels = []

    # Tag bazlı
    if any(kw in tags_str for kw in ['vegan', 'plant-based']):
        labels.append('VEGAN')
    if any(kw in tags_str for kw in ['vegetarian', 'veggie']):
        labels.append('VEGETARIAN')
    if any(kw in tags_str for kw in ['gluten-free', 'celiac']):
        labels.append('GLUTEN_FREE')
    if any(kw in tags_str for kw in ['dairy-free', 'lactose-free']):
        labels.append('DAIRY_FREE')
    if any(kw in tags_str for kw in ['low-carb', 'keto', 'ketogenic', 'atkins']):
        labels.append('LOW_CARB')
    if any(kw in tags_str for kw in ['low-fat', 'low-calorie', 'diet', 'light']):
        labels.append('LOW_FAT')
    if any(kw in tags_str for kw in ['high-protein', 'protein']):
        labels.append('HIGH_PROTEIN')
    if any(kw in tags_str for kw in ['mediterranean']):
        labels.append('MEDITERRANEAN')

    # Makro bazlı (etiket yoksa hesapla)
    if calories > 0:
        protein_pct = (protein * 4 / calories) * 100
        carbs_pct = (carbs * 4 / calories) * 100
        fat_pct = (fat * 9 / calories) * 100

        if protein_pct > 30 and 'HIGH_PROTEIN' not in labels:
            labels.append('HIGH_PROTEIN')
        if carbs_pct < 25 and 'LOW_CARB' not in labels:
            labels.append('LOW_CARB')
        if fat_pct < 20 and 'LOW_FAT' not in labels:
            labels.append('LOW_FAT')

    if not labels:
        labels.append('NORMAL')

    return labels


df['diet_labels'] = df.apply(
    lambda row: classify_diet_type(row['tags_list'], row['protein'], row['carbs'], row['fat'], row['calories']),
    axis=1
)

# Diyet etiketlerinin dağılımı
from collections import Counter
all_labels = [label for labels in df['diet_labels'] for label in labels]
label_counts = Counter(all_labels)
print(f"  Diyet etiketi dağılımı:")
for label, count in label_counts.most_common():
    print(f"    {label}: {count:,}")

# ═══════════════════════════════════════════════════════════════════
# ADIM 6: BESİN VEKTÖRÜ OLUŞTURMA ve SCALER
# ═══════════════════════════════════════════════════════════════════
print("\n📐 Adım 6: Besin vektörleri normalize ediliyor...")

nutrition_cols = ['calories', 'protein', 'fat', 'carbs']
scaler = MinMaxScaler()
df[['cal_norm', 'prot_norm', 'fat_norm', 'carb_norm']] = scaler.fit_transform(df[nutrition_cols])

print(f"  ✅ MinMaxScaler fit edildi")
print(f"  Kalori aralığı: {df['calories'].min():.0f} - {df['calories'].max():.0f} kcal")
print(f"  Protein aralığı: {df['protein'].min():.0f} - {df['protein'].max():.0f} g")

# ═══════════════════════════════════════════════════════════════════
# ADIM 7: ÖĞÜN SINIFLANDIRICISI EĞİT
# ═══════════════════════════════════════════════════════════════════
print("\n🤖 Adım 7: Öğün sınıflandırıcı model eğitiliyor...")

# Feature'lar: besin değerleri + hazırlanma süresi + malzeme sayısı
feature_cols = ['calories', 'protein', 'fat', 'carbs', 'sugar', 'sodium', 'minutes', 'n_ingredients']
X = df[feature_cols].fillna(0)
y = df['meal_type']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

clf = RandomForestClassifier(
    n_estimators=100,
    max_depth=15,
    random_state=42,
    n_jobs=-1
)
clf.fit(X_train, y_train)

accuracy = clf.score(X_test, y_test)
print(f"  ✅ Model eğitildi — Test doğruluğu: {accuracy:.1%}")

# Detaylı rapor
y_pred = clf.predict(X_test)
print("\n  Sınıflandırma Raporu:")
print(classification_report(y_test, y_pred, zero_division=0))

# ═══════════════════════════════════════════════════════════════════
# ADIM 8: FİNAL VERİTABANINI HAZIRLA
# ═══════════════════════════════════════════════════════════════════
print("\n📦 Adım 8: Final veritabanı hazırlanıyor...")

# Sadece gerekli sütunları sakla (boyutu küçültmek için)
recipe_db = df[[
    'name', 'id', 'minutes', 'n_ingredients',
    'calories', 'protein', 'fat', 'carbs', 'sugar', 'sodium',
    'cal_norm', 'prot_norm', 'fat_norm', 'carb_norm',
    'meal_type', 'diet_labels'
]].copy()

# İsim temizle
recipe_db['name'] = recipe_db['name'].str.strip().str.title()

# Duplikatları kaldır
recipe_db = recipe_db.drop_duplicates(subset=['name'], keep='first')

print(f"  ✅ Final veritabanı: {len(recipe_db):,} benzersiz tarif")
print(f"  Bellek boyutu: {recipe_db.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")

# ═══════════════════════════════════════════════════════════════════
# ADIM 9: MODELLERİ KAYDET
# ═══════════════════════════════════════════════════════════════════
print("\n💾 Adım 9: Modeller kaydediliyor...")

OUTPUT_DIR = "/kaggle/working"

# 1. Tarif veritabanı
recipe_db_path = os.path.join(OUTPUT_DIR, "recipe_database.pkl")
recipe_db.to_pickle(recipe_db_path)
size_mb = os.path.getsize(recipe_db_path) / 1024 / 1024
print(f"  📁 recipe_database.pkl ({size_mb:.1f} MB)")

# 2. Scaler
scaler_path = os.path.join(OUTPUT_DIR, "nutrition_scaler.pkl")
with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)
print(f"  📁 nutrition_scaler.pkl")

# 3. Öğün sınıflandırıcı
clf_path = os.path.join(OUTPUT_DIR, "meal_classifier.pkl")
with open(clf_path, 'wb') as f:
    pickle.dump(clf, f)
print(f"  📁 meal_classifier.pkl")

# 4. Metadata
metadata = {
    'total_recipes': len(recipe_db),
    'nutrition_cols': nutrition_cols,
    'feature_cols': feature_cols,
    'meal_types': list(recipe_db['meal_type'].unique()),
    'diet_labels': list(set(all_labels)),
    'scaler_min': scaler.data_min_.tolist(),
    'scaler_max': scaler.data_max_.tolist(),
    'model_accuracy': accuracy,
    'calorie_range': [float(df['calories'].min()), float(df['calories'].max())],
}
meta_path = os.path.join(OUTPUT_DIR, "diet_model_metadata.json")
with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)
print(f"  📁 diet_model_metadata.json")

# ═══════════════════════════════════════════════════════════════════
# ADIM 10: DEMO ÖNERİ TESTİ
# ═══════════════════════════════════════════════════════════════════
print("\n🧪 Adım 10: Demo öneri testi...")

from sklearn.metrics.pairwise import cosine_similarity

def demo_recommend(recipe_db, scaler, calorie_target, diet_goal, meal_type, top_k=3):
    """Basit bir öneri demo fonksiyonu."""
    # Makro hedefler
    macro_ratios = {
        'LOSE_WEIGHT': {'protein': 0.30, 'carbs': 0.40, 'fat': 0.30},
        'MAINTAIN':    {'protein': 0.25, 'carbs': 0.50, 'fat': 0.25},
        'GAIN_WEIGHT': {'protein': 0.30, 'carbs': 0.45, 'fat': 0.25},
    }
    ratios = macro_ratios.get(diet_goal, macro_ratios['MAINTAIN'])

    # Öğün kalori dağılımı
    meal_calorie_ratios = {
        'BREAKFAST': 0.25, 'SNACK_AM': 0.10,
        'LUNCH': 0.30, 'SNACK_PM': 0.05, 'DINNER': 0.30
    }
    slot_cal = calorie_target * meal_calorie_ratios.get(meal_type, 0.25)

    # Hedef vektörü oluştur
    target_protein = (slot_cal * ratios['protein']) / 4  # gram
    target_carbs = (slot_cal * ratios['carbs']) / 4
    target_fat = (slot_cal * ratios['fat']) / 9

    target_raw = np.array([[slot_cal, target_protein, target_fat, target_carbs]])
    target_norm = scaler.transform(target_raw)

    # Öğün tipine göre filtrele
    meal_type_filter = meal_type.replace('SNACK_AM', 'SNACK').replace('SNACK_PM', 'SNACK')
    candidates = recipe_db[recipe_db['meal_type'] == meal_type_filter].copy()

    # Kalori aralığı filtresi (±%30)
    cal_min = slot_cal * 0.70
    cal_max = slot_cal * 1.30
    candidates = candidates[(candidates['calories'] >= cal_min) & (candidates['calories'] <= cal_max)]

    if len(candidates) == 0:
        return []

    # Cosine similarity
    candidate_vecs = candidates[['cal_norm', 'prot_norm', 'fat_norm', 'carb_norm']].values
    similarities = cosine_similarity(target_norm, candidate_vecs)[0]
    candidates = candidates.copy()
    candidates['similarity'] = similarities

    # En iyi eşleşmeleri döndür
    top = candidates.nlargest(top_k, 'similarity')
    return top[['name', 'calories', 'protein', 'fat', 'carbs', 'similarity']].to_dict('records')


# Demo: 2000 kcal hedef, kilo verme
print(f"\n  Senaryo: 2000 kcal hedef, LOSE_WEIGHT")
for meal in ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']:
    results = demo_recommend(recipe_db, scaler, 2000, 'LOSE_WEIGHT', meal)
    print(f"\n  🍽️ {meal}:")
    for r in results[:2]:
        print(f"    → {r['name'][:40]:40s} | {r['calories']:6.0f} kcal | P:{r['protein']:5.1f}g F:{r['fat']:5.1f}g C:{r['carbs']:5.1f}g | sim:{r['similarity']:.3f}")


# ═══════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("  ✅ EĞİTİM TAMAMLANDI!")
print("=" * 60)
print(f"\n  Çıktı dosyaları ({OUTPUT_DIR}):")
for fname in ['recipe_database.pkl', 'nutrition_scaler.pkl', 'meal_classifier.pkl', 'diet_model_metadata.json']:
    fpath = os.path.join(OUTPUT_DIR, fname)
    if os.path.exists(fpath):
        size = os.path.getsize(fpath) / 1024
        unit = "KB" if size < 1024 else "MB"
        size_val = size if size < 1024 else size / 1024
        print(f"    📁 {fname} ({size_val:.1f} {unit})")

print(f"\n  ⬇️ Bu dosyaları indirip projenize koyun:")
print(f"     ml-service/app/models_saved/diet_recommender/")

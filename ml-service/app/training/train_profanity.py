"""
AI Asistan — Küfür/Argo Filtresi Model Eğitim Scripti

BU DOSYA GOOGLE COLAB ÜZERINDE ÇALIŞTIRILMAK İÇİN TASARLANMIŞTIR.
Aşağıdaki Colab notebook'unu kullanın:

Adımlar:
1. Google Colab'a gidin: https://colab.research.google.com
2. Yeni notebook oluşturun
3. Runtime > Change runtime type > T4 GPU seçin
4. Aşağıdaki hücreleri sırasıyla çalıştırın
"""

# ═══════════════════════════════════════════════════════════
# GOOGLE COLAB NOTEBOOK İÇERİĞİ
# Her "# %%"  bir hücreyi temsil eder
# ═══════════════════════════════════════════════════════════

# %% [markdown]
# # 🤖 AI Asistan — Türkçe Küfür/Argo Filtresi Eğitimi
# Bu notebook, Türkçe küfür ve argo tespiti için bir ML modeli eğitir.
# **Dataset:** Overfit-GM/turkish-toxic-language (77.800 örnek)
# **Model:** TF-IDF + Logistic Regression

# %% Hücre 1: Kütüphaneleri Kur
"""
!pip install datasets scikit-learn joblib pandas
"""

# %% Hücre 2: Kütüphaneleri Import Et
"""
import pandas as pd
import numpy as np
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
"""

# %% Hücre 3: Dataset'i İndir
"""
print("Dataset indiriliyor...")
dataset = load_dataset("Overfit-GM/turkish-toxic-language")
df = pd.DataFrame(dataset['train'])
print(f"Toplam örnek sayısı: {len(df)}")
print(f"Sütunlar: {df.columns.tolist()}")
print(f"\nSınıf dağılımı:")
print(df['label'].value_counts())
df.head(10)
"""

# %% Hücre 4: Veriyi Hazırla
"""
# Metin ve etiket sütunlarını belirle
# Dataset'in yapısına göre sütun adları değişebilir
# Genellikle: 'text' ve 'label' (0=non-offensive, 1=offensive)

text_col = 'text'  # Metin sütunu
label_col = 'label'  # Etiket sütunu (0=temiz, 1=argo/küfür)

# NaN değerleri temizle
df = df.dropna(subset=[text_col, label_col])

# Etiketleri integer'a çevir
df[label_col] = df[label_col].astype(int)

print(f"Temizlenmiş veri boyutu: {len(df)}")
print(f"\nSınıf dağılımı:")
print(f"  Temiz (0): {(df[label_col] == 0).sum()}")
print(f"  Argo/Küfür (1): {(df[label_col] == 1).sum()}")

# Örnek veriler göster
print("\n--- Temiz Örnekler ---")
for text in df[df[label_col] == 0][text_col].head(3):
    print(f"  ✅ {text[:100]}")

print("\n--- Argo/Küfür Örnekler ---")
for text in df[df[label_col] == 1][text_col].head(3):
    print(f"  ❌ {text[:100]}")
"""

# %% Hücre 5: Train/Test Böl
"""
X = df[text_col].values
y = df[label_col].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Eğitim seti: {len(X_train)} örnek")
print(f"Test seti:   {len(X_test)} örnek")
"""

# %% Hücre 6: TF-IDF Vektörizasyonu
"""
print("TF-IDF vektörizasyonu yapılıyor...")
vectorizer = TfidfVectorizer(
    max_features=50000,      # En çok 50K kelime
    ngram_range=(1, 2),      # Tek kelime + kelime çiftleri
    min_df=2,                # En az 2 dokümanda geçen kelimeler
    max_df=0.95,             # Çok yaygın kelimeleri çıkar
    sublinear_tf=True,       # Log normalizasyonu
    strip_accents='unicode', # Türkçe karakter normalizasyonu
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

print(f"Vocabulary boyutu: {len(vectorizer.vocabulary_)}")
print(f"TF-IDF matris boyutu: {X_train_tfidf.shape}")
"""

# %% Hücre 7: Model Eğit
"""
print("Logistic Regression modeli eğitiliyor...")
model = LogisticRegression(
    C=1.0,
    max_iter=1000,
    class_weight='balanced',  # Dengesiz sınıflar için
    solver='lbfgs',
    random_state=42,
    n_jobs=-1,                # Tüm CPU çekirdeklerini kullan
)

model.fit(X_train_tfidf, y_train)
print("Model eğitimi tamamlandı!")
"""

# %% Hücre 8: Model Performansını Değerlendir
"""
y_pred = model.predict(X_test_tfidf)

print("=" * 50)
print("MODEL PERFORMANSI")
print("=" * 50)
print(f"\nDoğruluk (Accuracy): {accuracy_score(y_test, y_pred):.4f}")
print(f"\nDetaylı Rapor:")
print(classification_report(y_test, y_pred, target_names=['Temiz', 'Argo/Küfür']))

print(f"\nKarışıklık Matrisi:")
cm = confusion_matrix(y_test, y_pred)
print(f"  Gerçek Temiz → Temiz tahmin: {cm[0][0]}")
print(f"  Gerçek Temiz → Argo tahmin:  {cm[0][1]} (yanlış alarm)")
print(f"  Gerçek Argo  → Temiz tahmin: {cm[1][0]} (kaçırılan)")
print(f"  Gerçek Argo  → Argo tahmin:  {cm[1][1]}")
"""

# %% Hücre 9: Modeli Test Et (Örneklerle)
"""
test_sentences = [
    "Bugün hava çok güzel, dışarı çıkmak istiyorum",
    "Bu adam gerçekten çok salak ve aptal biri",
    "Malatya'nın malı çok meşhurdur",
    "Yarın toplantı var, hazırlanmam lazım",
    "Sana ne lan, karışma bana",
    "Çok güzel bir yemek tarifi paylaşmak istiyorum",
    "Bu proje çok boktan çıktı",
    "Annem çok güzel pasta yapmış",
]

print("=" * 60)
print("ÖRNEK TAHMİNLER")
print("=" * 60)
for sentence in test_sentences:
    features = vectorizer.transform([sentence])
    pred = model.predict(features)[0]
    proba = model.predict_proba(features)[0]
    label = "❌ ARGO" if pred == 1 else "✅ TEMİZ"
    score = proba[1]  # argo olma olasılığı
    print(f"\n  {label} (skor: {score:.3f})")
    print(f"  \"{sentence}\"")
"""

# %% Hücre 10: Modeli Kaydet ve İndir
"""
# Modeli kaydet
os.makedirs("models_saved", exist_ok=True)
joblib.dump(model, "models_saved/profanity_model.joblib")
joblib.dump(vectorizer, "models_saved/profanity_vectorizer.joblib")

print("✅ Model kaydedildi!")
print("   - models_saved/profanity_model.joblib")
print("   - models_saved/profanity_vectorizer.joblib")

# Google Colab'dan indir
from google.colab import files
import shutil

shutil.make_archive("profanity_model", 'zip', "models_saved")
files.download("profanity_model.zip")

print("")
print("=" * 60)
print("📥 profanity_model.zip indirildi!")
print("")
print("ŞİMDİ YAPMANIZ GEREKEN:")
print("1. İndirilen profanity_model.zip dosyasını açın")
print("2. İçindeki 2 dosyayı şu klasöre kopyalayın:")
print("   ml-service/app/models_saved/")
print("     ├── profanity_model.joblib")
print("     └── profanity_vectorizer.joblib")
print("3. ML service'i yeniden başlatın")
print("=" * 60)
"""

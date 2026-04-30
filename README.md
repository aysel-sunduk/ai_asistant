AI Asistan
==========

Bu repo, tek bir mobil uygulama icinde birden fazla yasam alanini yoneten cok modullu bir "AI Asistan" projesidir.

Canli moduller:
- Is planlama (etkinlik, mail draft, hatirlatici)
- Saglik (log, hedef)
- Finans (yatirim, doviz, favoriler, holding)
- Hedefler (goal + ilerleme)
- Blog ve sosyal (post, begeni, takip/follow request)
- Alisveris listeleri
- Oyun skor ve leaderboard
- ML destekli servisler (icerik filtreleme, baslik onerisi vb.)

Proje yapisi
------------
- `backend/`: Spring Boot REST API
- `frontend/`: Expo React Native uygulamasi
- `ml-service/`: Python FastAPI tabanli ML servisleri
- `Gorseller/`: Tasarim referanslari

Mimari ozet
-----------
- Backend ana API: `http://<host>:8080/api`
- Taban context-path: `/api`
- Frontend API client, varsayilan olarak `http://<host>:8080/api` adresine gider.
- Veritabani: PostgreSQL + Flyway migration
- Kimlik dogrulama: JWT access/refresh token

Kurulum - Backend
-----------------
Gereksinimler:
- Java 21
- Maven Wrapper (repo icinde var)
- PostgreSQL

Ornek calistirma:
1. Veritabani olustur ve `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` env degiskenlerini ayarla.
2. `backend/` klasorune gir:
   - Windows PowerShell:
     - `cd backend`
     - `./mvnw spring-boot:run`
3. API ayaga kalkinca base URL:
   - `http://localhost:8080/api`

Kurulum - Frontend (Expo)
-------------------------
Gereksinimler:
- Node.js 18+
- npm
- Expo CLI (global zorunlu degil)

Calistirma:
1. `frontend/` klasorune gir:
   - `cd frontend`
2. Bagimliliklari kur:
   - `npm install`
3. Uygulamayi baslat:
   - `npm run start`

Not:
- Frontend `frontend/src/api/client.ts` icinde varsayilan API URL tanimli.
- Gerekirse `EXPO_PUBLIC_API_URL` ile override edebilirsin.

Kurulum - ML Service
--------------------
Gereksinimler:
- Python 3.10+

Calistirma:
1. `ml-service/` klasorune gir:
   - `cd ml-service`
2. Sanal ortam + bagimlilik:
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate` (Windows)
   - `pip install -r requirements.txt`
3. Servisi baslat:
   - `uvicorn app.main:app --reload --port 8001`

Onemli ortam degiskenleri
-------------------------
Backend:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `OPENAI_API_KEY` (opsiyonel)
- `GEMINI_API_KEY` (opsiyonel)
- `PUSH_ENABLED` (varsayilan: `true`)
- `PUSH_EXPO_URL` (varsayilan: `https://exp.host/--/api/v2/push/send`)

API Dokumantasyonu
------------------
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api/v3/api-docs`

Notlar
------
- Migration dosyalari `backend/src/main/resources/db/migration/` altindadir.
- Bu repo aktif gelistirme altindadir; endpoint ve modeller iteratif olarak gelismektedir.

## Yapay Zeka ve ML Modelleri

Uygulama, farklı yaşam alanlarında kullanıcıya rehberlik etmek için özelleştirilmiş makine öğrenmesi modelleri kullanır. Bu modeller `ml-service` altında Python FastAPI ile sunulmaktadır.

| Özellik / Modül | Model Mimarisi | Veri Seti (Dataset) | Kullanım Amacı |
| :--- | :--- | :--- | :--- |
| **Diyet Önerisi** | RandomForest + Cosine Similarity | Food.com Recipes (Kaggle) | Kullanıcı hedeflerine (Kilo ver, Koru, Al) göre öğün önerisi. |
| **Yatırım Danışmanı** | KMeans + SVD (Collaborative Filtering) | Sentetik Yatırımcı & Varlık Verisi | Risk profili analizi ve kişiye özel BUY/HOLD/SELL tavsiyeleri. |
| **Yemek Analizi** | EfficientNetV2-S (PyTorch) | Turkish Foods (Custom) | Fotoğraftan yemek tanıma ve besin değeri (Kalori, P, Y, K) tahmini. |
| **Küfür/Argo Filtresi** | FastText + Custom Blacklist | Turkish Profanity Dataset | Blog ve yorumlardaki uygunsuz içeriklerin otomatik temizlenmesi. |
| **Başlık Önerisi** | Fine-tuned GPT-2 Turkish | Blog & News Titles | İçeriğe göre dikkat çekici ve kategori uyumlu başlık üretimi. |
| **Motivasyon Tahmini** | RandomForestClassifier | Player Archetypes Data | Oyuncu davranışına göre dinamik motivasyon mesajları seçimi. |
| **Oyun Analizörü** | KMeans + Linear Regression | Gameplay Stats | Oyuncu segmentasyonu ve performans trendi (gelişim) analizi. |
| **Alışveriş Önerisi** | FP-Growth + TF-IDF Hybrid | Market Basket Analysis Data | "Birlikte alınanlar" ve stok yenileme (replenishment) tahmini. |
| **Sesli Komut (STT)** | OpenAI Whisper / Wav2Vec2 | Common Voice Turkish | Sesli girdilerin metne ve uygulama komutlarına dönüştürülmesi. |

---

### Detaylı Model İncelemesi

#### 1. Sağlık & Diyet (Health Module)
- **Model:** `RandomForest` öğün tipi (Kahvaltı, Öğle vb.) sınıflandırması yaparken, `Cosine Similarity` kullanıcının hedef kalorisine ve makro oranlarına en yakın tarifleri veritabanından eşleştirir.
- **Dataset:** shuyangli94 tarafından paylaşılan 230.000+ tarif içeren Food.com veri seti kullanılmıştır.

#### 2. Finans & Yatırım (Finance Module)
- **Model:** Hibrit bir yapı kullanılır. `KMeans` kümeleme ile kullanıcının harcama ve birikim alışkanlıklarından "Muhafazakar", "Dengeli" veya "Agresif" risk profili çıkarılır. `SVD` (Singular Value Decomposition) ise benzer yatırımcıların tercihlerine göre varlık önerir.

#### 3. Görsel Yemek Analizi (CV Module)
- **Model:** `EfficientNetV2-S` mimarisi üzerine inşa edilmiş çok görevli (multi-task) bir modeldir. Hem yemeğin kategorisini sınıflandırır hem de regresyon katmanı ile besin değerlerini tahmin eder.
- **Dataset:** Türkiye mutfağına özgü 150 farklı yemek kategorisinden oluşan özel bir veri seti ile eğitilmiştir.

#### 4. Blog & İçerik Güvenliği (Social Module)
- **Model:** `GPT-2 Turkish` modeli, blog içeriklerinden anlamlı başlıklar türetmek için fine-tune edilmiştir. Argo filtresinde ise kelime gömmeleri (embeddings) kullanılarak sadece kelime eşleşmesi değil, anlamsal benzerlik de denetlenir.

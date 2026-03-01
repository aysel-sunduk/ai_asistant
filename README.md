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

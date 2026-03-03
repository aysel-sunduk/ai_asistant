**Local `.env` kullanımı ve nasıl çalıştırılır**

- Proje, hassas verileri `application.yml` içinde doğrudan saklamaz; bu değerler ortam değişkenlerinden okunur.
- Lokal geliştirme için `backend/.env` dosyası eklendi (bu dosya `.gitignore` içinde olduğu için repoya commit edilmez).

Uygulama, başlarken `backend/.env` dosyasını otomatik okumak için küçük bir loader içerir (`com.aiasistan.Application.loadDotenv`). Bu loader:
- çalışma dizininde ve üst dizinlerde `.env` arar (4 seviye kadar),
- varsa satırları `KEY=VALUE` formatında okuyup eksik System property'leri doldurur,
- mevcut ortam değişkenlerini veya system property'leri ezmez (öncelik env ve system properties'dedir).

Windows (PowerShell) ile çalıştırma örneği (projeye göre dizini ayarlayın):
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Linux/macOS (bash):
```bash
cd backend
./mvnw spring-boot:run
```

Notlar:
- Production için: `JWT_SECRET` ve DB bilgilerini CI/CD veya secret manager aracılığıyla verin; `.env` yalnızca lokal geliştirme içindir.
- Docker Compose kullanıyorsanız `docker-compose` zaten `.env` dosyasını otomatik okur.

Google Calendar entegrasyonu icin ek degiskenler:
```env
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_CREDENTIALS_FILE=D:/Downloads/client_secret_190553526852-o9h3vor5p59avtngjpbjfbitmtdo4g68.apps.googleusercontent.com.json
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_SCOPE=https://www.googleapis.com/auth/calendar.events
```

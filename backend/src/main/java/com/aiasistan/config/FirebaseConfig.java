package com.aiasistan.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${app.push.firebase.config-path:${app.firebase.config-path:${FCM_CREDENTIALS_FILE:${FIREBASE_CREDENTIALS_PATH:}}}}")
    private String configPath;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                if (configPath == null || configPath.isEmpty()) {
                    logger.warn("Firebase yapılandırma yolu belirtilmemiş. Bildirimler çalışmayabilir.");
                    return;
                }

                if (!Files.exists(Paths.get(configPath))) {
                    logger.error("Firebase JSON dosyası bulunamadı: {}. Lütfen .env dosyasını kontrol edin.", configPath);
                    return;
                }

                FileInputStream serviceAccount = new FileInputStream(configPath);

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                logger.info("Firebase Admin SDK başarıyla başlatıldı (Dosya: {})", configPath);
            }
        } catch (IOException e) {
            logger.error("Firebase başlatılırken hata oluştu: {}", e.getMessage());
            // Uygulamanın çökmemesi için hatayı fırlatmıyoruz, sadece logluyoruz.
        }
    }
}

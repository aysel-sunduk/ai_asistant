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

    @Value("${app.firebase.credentials-file:}")
    private String credentialsFile;

    @PostConstruct
    public void initialize() {
        if (credentialsFile == null || credentialsFile.isBlank()) {
            logger.warn("Firebase credentials-file yolu belirtilmemis. Bildirim servisi calismayabilir.");
            return;
        }

        try {
            if (!Files.exists(Paths.get(credentialsFile))) {
                logger.error("Firebase credentials dosyasi bulunamadi: {}", credentialsFile);
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(new FileInputStream(credentialsFile)))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                logger.info("Firebase Admin SDK basariyla baslatildi. Dosya: {}", credentialsFile);
            }
        } catch (IOException e) {
            logger.error("Firebase Admin SDK baslatilirken hata: {}", e.getMessage());
        }
    }
}

/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Application {

    public static void main(String[] args) {
        // attempt to load a local .env file (searching upward) into system properties for local dev
        loadDotenv();
        SpringApplication.run(Application.class, args);
    }

    private static void loadDotenv() {
        Path envPath = findEnvFile(4); // search up to 4 levels
        if (envPath == null) return;
        try (BufferedReader br = Files.newBufferedReader(envPath)) {
            br.lines().forEach(l -> {
                String line = l.replace("\uFEFF", "").trim();
                if (line.isEmpty() || line.startsWith("#")) return;
                int eq = line.indexOf('=');
                if (eq <= 0) return;
                String key = line.substring(0, eq).trim();
                String val = line.substring(eq + 1).trim();
                if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length() - 1);
                }
                // Gmail app password is shown in groups of 4 chars; accept accidental spaces in .env.
                if ("MAIL_PASS".equals(key) || "SMTP_PASS".equals(key)) {
                    val = val.replace(" ", "");
                }
                // Respect existing environment variables or system properties if they have a value
                String existingEnv = System.getenv(key);
                if (existingEnv != null && !existingEnv.isBlank()) return;
                String existingProp = System.getProperty(key);
                if (existingProp != null && !existingProp.isBlank()) return;
                try {
                    System.setProperty(key, val);
                } catch (Exception ignored) {
                }
            });
        } catch (IOException ignored) {
        }
    }

    private static Path findEnvFile(int maxUpLevels) {
        try {
            Path cwd = Path.of("").toAbsolutePath();
            Path cur = cwd;
            for (int i = 0; i <= maxUpLevels; i++) {
                Path candidate = cur.resolve(".env");
                if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                    return candidate;
                }
                // also check a 'backend/.env' relative path (common workspace layout)
                Path backendCandidate = cur.resolve("backend").resolve(".env");
                if (Files.exists(backendCandidate) && Files.isRegularFile(backendCandidate)) {
                    return backendCandidate;
                }
                cur = cur.getParent();
                if (cur == null) break;
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
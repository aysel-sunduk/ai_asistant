/**
 * Kisa aciklama: Oyun AI servisi — ML microservice ile iletişim kurar.
 */

package com.aiasistan.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.aiasistan.model.GameScore;
import com.aiasistan.repository.GameScoreRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Oyun AI servisi.
 * K-Means ile oyuncu segmentasyonu ve Linear Regression ile performans trendi.
 * ML Service down ise fallback istatistik hesaplar.
 */
@Service
public class GameAIService {

    private static final Logger logger = LoggerFactory.getLogger(GameAIService.class);

    @Value("${ML_SERVICE_URL:http://localhost:8001}")
    private String mlServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GameScoreRepository gameScoreRepository;
    private final UserService userService;

    public GameAIService(GameScoreRepository gameScoreRepository, UserService userService) {
        this.gameScoreRepository = gameScoreRepository;
        this.userService = userService;
    }

    /**
     * Oyuncu segmentasyonu — K-Means ile segment belirler.
     */
    public Map<String, Object> getPlayerSegment(String userEmail, String gameKey) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        List<GameScore> scores = gameScoreRepository
                .findByUserIdAndGameKeyOrderByPlayedAtDesc(userId, gameKey);

        if (scores.isEmpty()) {
            return Map.of(
                    "segment", "Bilinmiyor",
                    "message", "Henüz oyun oynamamışsın. İlk oyununu oyna! 🎮",
                    "method", "no_data",
                    "stats", Map.of());
        }

        List<Map<String, Object>> scoreList = convertScoresToList(scores);

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of("scores", scoreList));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/game/player-segment"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                JsonNode data = json.get("data");
                if (data != null) {
                    return objectMapper.convertValue(data,
                            objectMapper.getTypeFactory()
                                    .constructMapType(HashMap.class, String.class, Object.class));
                }
            }
        } catch (Exception e) {
            logger.warn("ML service oyuncu segmenti alınamadı, fallback: {}", e.getMessage());
        }

        return fallbackPlayerSegment(scores);
    }

    /**
     * Performans trendi — Linear Regression ile gelişim hesaplar.
     */
    public Map<String, Object> getPerformanceTrend(String userEmail, String gameKey) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        List<GameScore> scores = gameScoreRepository
                .findByUserIdAndGameKeyOrderByPlayedAtDesc(userId, gameKey);

        if (scores.size() < 2) {
            return Map.of(
                    "trend", "yetersiz_veri",
                    "improvementPct", 0,
                    "message", "Trend hesaplamak için en az 2 oyun gerekli.",
                    "method", "insufficient_data",
                    "weeklyAvgScores", List.of());
        }

        List<Map<String, Object>> scoreList = convertScoresToList(scores);

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of("scores", scoreList));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/game/performance-trend"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                JsonNode data = json.get("data");
                if (data != null) {
                    return objectMapper.convertValue(data,
                            objectMapper.getTypeFactory()
                                    .constructMapType(HashMap.class, String.class, Object.class));
                }
            }
        } catch (Exception e) {
            logger.warn("ML service performans trendi alınamadı, fallback: {}", e.getMessage());
        }

        return fallbackPerformanceTrend(scores);
    }

    /**
     * Motivasyon mesajı — RandomForest ile oyuncu davranışına göre mesaj üretir.
     */
    public Map<String, Object> getMotivationMessage(String userEmail, String gameKey) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        List<GameScore> scores = gameScoreRepository
                .findByUserIdAndGameKeyOrderByPlayedAtDesc(userId, gameKey);

        // Oyuncu istatistiklerini hesapla
        int playCount = scores.size();
        double avgScore = scores.stream().mapToInt(GameScore::getScore).average().orElse(0);
        int maxLevel = scores.stream().mapToInt(s -> s.getLevel() != null ? s.getLevel() : 1).max().orElse(1);
        double totalHours = scores.stream().mapToInt(s -> s.getDurationSec() != null ? s.getDurationSec() : 0).sum()
                / 3600.0;
        double avgDurationMin = scores.stream().mapToInt(s -> s.getDurationSec() != null ? s.getDurationSec() : 0)
                .average().orElse(0) / 60.0;

        // Haftalık oturum tahmini (son 7 günde kaç oyun?)
        int sessionsPerWeek = Math.min(playCount, 7);
        if (playCount > 7) {
            long recentCount = scores.stream()
                    .filter(s -> s.getPlayedAt() != null &&
                            s.getPlayedAt().isAfter(OffsetDateTime.now().minusDays(7)))
                    .count();
            sessionsPerWeek = (int) recentCount;
        }

        // Başarı tahmini (skor bazlı)
        int achievements = Math.min((int) (avgScore / 20), 49);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("age", 25); // varsayılan
        requestBody.put("playTimeHours", Math.round(totalHours * 10.0) / 10.0);
        requestBody.put("inGamePurchases", 0);
        requestBody.put("sessionsPerWeek", sessionsPerWeek);
        requestBody.put("avgSessionDurationMinutes", (int) Math.round(avgDurationMin));
        requestBody.put("playerLevel", maxLevel);
        requestBody.put("achievementsUnlocked", achievements);
        requestBody.put("gameDifficulty", "Medium");

        try {
            String body = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/game/motivation"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                JsonNode data = json.get("data");
                if (data != null) {
                    return objectMapper.convertValue(data,
                            objectMapper.getTypeFactory()
                                    .constructMapType(HashMap.class, String.class, Object.class));
                }
            }
        } catch (Exception e) {
            logger.warn("ML service motivasyon mesajı alınamadı, fallback: {}", e.getMessage());
        }

        return fallbackMotivation(playCount, avgScore, maxLevel);
    }

    // ─── Yardımcı Metotlar ───

    private List<Map<String, Object>> convertScoresToList(List<GameScore> scores) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (GameScore s : scores) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("score", s.getScore());
            entry.put("durationSec", s.getDurationSec());
            entry.put("level", s.getLevel());
            entry.put("playedAt", s.getPlayedAt() != null ? s.getPlayedAt().toString() : null);
            result.add(entry);
        }
        return result;
    }

    private Map<String, Object> fallbackPlayerSegment(List<GameScore> scores) {
        double avgScore = scores.stream().mapToInt(GameScore::getScore).average().orElse(0);
        int playCount = scores.size();

        String segment;
        String message;
        if (playCount < 5) {
            segment = "Başlangıç";
            message = "Yeni başladın, her oyun bir öğrenme fırsatı! 🌱";
        } else if (avgScore < 300) {
            segment = "Gelişen";
            message = "Güzel ilerliyorsun, böyle devam et! 📈";
        } else if (avgScore < 700) {
            segment = "Düzenli";
            message = "İstikrarlı bir oyuncusun, harika! 💪";
        } else {
            segment = "Usta";
            message = "Üst düzey performans, tebrikler! 🏆";
        }

        return Map.of(
                "segment", segment,
                "message", message,
                "method", "fallback",
                "stats", Map.of(
                        "avgScore", Math.round(avgScore * 10.0) / 10.0,
                        "playCount", playCount));
    }

    private Map<String, Object> fallbackPerformanceTrend(List<GameScore> scores) {
        List<Integer> scoreVals = scores.stream()
                .sorted((a, b) -> {
                    OffsetDateTime at = a.getPlayedAt();
                    OffsetDateTime bt = b.getPlayedAt();
                    if (at == null || bt == null)
                        return 0;
                    return at.compareTo(bt);
                })
                .map(GameScore::getScore)
                .toList();

        int half = scoreVals.size() / 2;
        double firstAvg = scoreVals.subList(0, half).stream().mapToInt(i -> i).average().orElse(0);
        double secondAvg = scoreVals.subList(half, scoreVals.size()).stream().mapToInt(i -> i).average().orElse(0);
        double changePct = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 1000.0) / 10.0 : 0;

        String trend = changePct > 0 ? "yükseliş" : changePct < 0 ? "düşüş" : "stabil";
        String emoji = changePct > 0 ? "📈" : changePct < 0 ? "📉" : "➡️";
        String message = changePct > 0
                ? String.format("Son oyunlarında %%%.1f gelişme gösterdin! %s", Math.abs(changePct), emoji)
                : changePct < 0
                        ? String.format("Son oyunlarında %%%.1f düşüş var, toparlanabilirsin! %s",
                                Math.abs(changePct), emoji)
                        : "Performansın stabil devam ediyor. ➡️";

        return Map.of(
                "trend", trend,
                "improvementPct", changePct,
                "message", message,
                "method", "fallback",
                "recentAvg", Math.round(secondAvg * 10.0) / 10.0,
                "previousAvg", Math.round(firstAvg * 10.0) / 10.0,
                "weeklyAvgScores", List.of());
    }

    private Map<String, Object> fallbackMotivation(int playCount, double avgScore, int maxLevel) {
        String labelName;
        String message;

        if (playCount == 0) {
            labelName = "yeni_oyuncu";
            message = "Oyun dünyasına hoş geldin, macera başlıyor! 🎉";
        } else if (playCount < 3) {
            labelName = "yeni_oyuncu";
            message = "Her usta bir zamanlar çıraktı, devam et! 🎯";
        } else if (maxLevel >= 70 && avgScore > 500) {
            labelName = "basarili_oyuncu";
            message = "Üst düzey performans, tebrikler şampiyon! 🏆";
        } else if (playCount >= 10) {
            labelName = "aktif_oyuncu";
            message = "Harika tempoya devam! Enerjin bulaşıcı! 🔥";
        } else {
            labelName = "gelisen_oyuncu";
            message = "Güzel ilerliyorsun, böyle devam! 📈";
        }

        return Map.of(
                "label", 2,
                "labelName", labelName,
                "message", message,
                "method", "fallback");
    }
}

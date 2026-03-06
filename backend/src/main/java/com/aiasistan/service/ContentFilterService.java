/**
 * ContentFilterService — Python ML Service ile icerik filtreleme.
 * 
 * Blog yazilari ve yorumlardaki argo/kufur iceriklerini filtreler.
 * ML service erisilebildiginde ML modelini, erisilemediginde
 * fallback olarak mevcut kara listeyi kullanir.
 */

package com.aiasistan.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ContentFilterService {

    private static final Logger logger = LoggerFactory.getLogger(ContentFilterService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // ML Service URL — application.yml'den okunacak, varsayılan localhost:8001
    private final String mlServiceUrl;
    private final HttpClient httpClient;

    // Fallback kara liste (ML service çalışmıyorsa kullanılır)
    private static final Set<String> FALLBACK_BLACKLIST = Set.of(
            "salak", "aptal", "gerizekalı", "gerizekali", "mal", "lan", "ulan",
            "sacma", "kotu", "dangalak", "ahmak", "beyinsiz", "budala",
            "serefsiz", "namussuz", "terbiyesiz", "ahlaksiz", "rezil",
            "pislik", "bok", "boktan", "hergele", "enayi", "avanak",
            "ezik", "gerzek", "sersem", "embesil");

    public ContentFilterService() {
        this.mlServiceUrl = System.getProperty("ML_SERVICE_URL",
                System.getenv("ML_SERVICE_URL") != null
                        ? System.getenv("ML_SERVICE_URL")
                        : "http://localhost:8001");

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        logger.info("ContentFilterService initialized — ML Service URL: {}", mlServiceUrl);
    }

    /**
     * Metni filtrele: önce ML service'e sor, erişilemezse fallback kara liste
     * kullan.
     */
    public FilterResult filterText(String text) {
        if (text == null || text.isBlank()) {
            return new FilterResult(text != null ? text : "", true, 0.0, List.of(), false);
        }

        // ML Service'e bağlanmayı dene
        try {
            return callMlService(text);
        } catch (Exception e) {
            logger.debug("ML service erisilemedi ({}), fallback kullaniliyor.", e.getMessage());
            return fallbackFilter(text);
        }
    }

    /**
     * Yorum metnini filtrele.
     */
    public FilterResult filterComment(String comment) {
        return filterText(comment);
    }

    /**
     * ML Service'ın çalışıp çalışmadığını kontrol et.
     */
    public boolean isMlServiceAvailable() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/health"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    // ─── ML Service çağrısı ─────────────────────────────

    private FilterResult callMlService(String text) throws Exception {
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "text", text,
                "threshold", 0.5));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(mlServiceUrl + "/api/filter/profanity"))
                .timeout(Duration.ofSeconds(5))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("ML service HTTP " + response.statusCode());
        }

        JsonNode json = objectMapper.readTree(response.body());

        String cleanedText = json.get("cleaned_text").asText();
        boolean isSafe = json.get("is_safe").asBoolean();
        double score = json.has("profanity_score") && !json.get("profanity_score").isNull()
                ? json.get("profanity_score").asDouble()
                : 0.0;

        List<String> flaggedWords = List.of();
        if (json.has("flagged_words") && json.get("flagged_words").isArray()) {
            flaggedWords = objectMapper.convertValue(
                    json.get("flagged_words"),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        }

        return new FilterResult(cleanedText, isSafe, score, flaggedWords, true);
    }

    // ─── Fallback kara liste filtresi ───────────────────

    private FilterResult fallbackFilter(String text) {
        String cleaned = text;
        int hitCount = 0;

        for (String word : FALLBACK_BLACKLIST) {
            String pattern = "(?i)\\b" + java.util.regex.Pattern.quote(word) + "\\b";
            if (cleaned.matches(".*" + pattern + ".*")) {
                hitCount++;
                String replacement = maskWord(word);
                cleaned = cleaned.replaceAll(pattern, replacement);
            }
        }

        boolean isSafe = hitCount == 0;
        return new FilterResult(cleaned, isSafe, hitCount > 0 ? 0.8 : 0.0, List.of(), false);
    }

    private String maskWord(String word) {
        if (word.length() <= 2) {
            return "**";
        }
        return word.charAt(0) + "*".repeat(word.length() - 2) + word.charAt(word.length() - 1);
    }

    // ─── Sonuç sınıfı ──────────────────────────────────

    /**
     * Filtreleme sonucu.
     */
    public static class FilterResult {
        private final String cleanedText;
        private final boolean safe;
        private final double profanityScore;
        private final List<String> flaggedWords;
        private final boolean mlUsed;

        public FilterResult(String cleanedText, boolean safe, double profanityScore,
                List<String> flaggedWords, boolean mlUsed) {
            this.cleanedText = cleanedText;
            this.safe = safe;
            this.profanityScore = profanityScore;
            this.flaggedWords = flaggedWords;
            this.mlUsed = mlUsed;
        }

        public String getCleanedText() {
            return cleanedText;
        }

        public boolean isSafe() {
            return safe;
        }

        public double getProfanityScore() {
            return profanityScore;
        }

        public List<String> getFlaggedWords() {
            return flaggedWords;
        }

        public boolean isMlUsed() {
            return mlUsed;
        }
    }
}

/**
 * Kisa aciklama: Blog baslik onerisi servisi - ML microservice ve OpenRouter AI ile iletisim kurar.
 */

package com.aiasistan.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Blog baslik onerisi servisi.
 * 3 kademeli: ML microservice -> OpenRouter AI -> Kural tabanli fallback.
 */
@Service
public class TitleSuggestionService {

    private static final Logger logger = LoggerFactory.getLogger(TitleSuggestionService.class);

    @Value("${ML_SERVICE_URL:http://localhost:8001}")
    private String mlServiceUrl;

    // ML service icin kisa timeout (hizli fail-over)
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OpenRouterAiService openRouterAiService;

    public TitleSuggestionService(OpenRouterAiService openRouterAiService) {
        this.openRouterAiService = openRouterAiService;
    }

    /**
     * Blog iceriginden baslik onerileri al.
     * Once ML service, sonra OpenRouter AI, en son kural tabanli fallback.
     */
    public List<String> suggestTitles(String content, String category, int numSuggestions) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        // 1. Kademe: ML microservice (hizli timeout)
        List<String> mlTitles = tryMlService(content, category, numSuggestions);
        if (mlTitles != null && !mlTitles.isEmpty()) {
            logger.info("Blog baslik onerisi ML service ile uretildi");
            return mlTitles;
        }

        // 2. Kademe: OpenRouter AI
        logger.info("ML service basarisiz, OpenRouter AI deneniyor...");
        List<String> aiTitles = openRouterAiService.generateBlogTitleSuggestions(content, category, numSuggestions);
        if (!aiTitles.isEmpty()) {
            logger.info("Blog baslik onerisi OpenRouter AI ile uretildi ({} adet)", aiTitles.size());
            return aiTitles;
        }

        // 3. Kademe: Kural tabanli fallback
        logger.info("OpenRouter AI basarisiz, fallback kullaniliyor");
        return fallbackTitles(content);
    }

    /**
     * ML microservice'e baslik onerisi istegi gonderir.
     * Kisa timeout ile calisiyor - ML service yoksa hizli fail-over.
     */
    private List<String> tryMlService(String content, String category, int numSuggestions) {
        try {
            String safeCategory = (category == null || category.isBlank()) ? "genel" : category;
            int safeNum = Math.min(Math.max(numSuggestions, 1), 5);

            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "content", content,
                    "category", safeCategory,
                    "num_suggestions", safeNum,
                    "temperature", 0.7));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/blog/suggest-title"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(5))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                JsonNode titlesNode = json.get("titles");
                String modelUsed = json.has("model_used") ? json.get("model_used").asText() : "unknown";
                logger.debug("ML baslik onerisi alindi (model: {})", modelUsed);

                if (titlesNode != null && titlesNode.isArray()) {
                    List<String> titles = new java.util.ArrayList<>();
                    for (JsonNode t : titlesNode) {
                        titles.add(t.asText());
                    }
                    return titles;
                }
            } else {
                logger.warn("ML service baslik onerisi HTTP {}", response.statusCode());
            }

        } catch (Exception e) {
            logger.debug("ML service baglanti hatasi (beklenen): {}", e.getMessage());
        }

        return null;
    }

    /**
     * Kural tabanli fallback: icerigin ilk cumlesini baslik oner.
     */
    private List<String> fallbackTitles(String content) {
        String trimmed = content.trim();

        String[] sentences = trimmed.split("[.!?]\\s+");
        String firstSentence = sentences.length > 0 ? sentences[0].trim() : trimmed;

        if (firstSentence.length() > 100) {
            firstSentence = firstSentence.substring(0, 100) + "...";
        }

        String[] words = trimmed.split("\\s+");
        String shortTitle = String.join(" ",
                java.util.Arrays.copyOfRange(words, 0, Math.min(5, words.length)));

        return List.of(firstSentence, shortTitle)
                .stream()
                .filter(t -> !t.isBlank())
                .distinct()
                .toList();
    }
}

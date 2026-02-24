/**
 * Kisa aciklama: Blog başlık önerisi servisi — ML microservice ile iletişim kurar.
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
 * Blog başlık önerisi servisi.
 * GPT-2 Turkish ile eğitilmiş modele istek gönderir.
 * Model yoksa kural-tabanlı fallback öneriler döner.
 */
@Service
public class TitleSuggestionService {

    private static final Logger logger = LoggerFactory.getLogger(TitleSuggestionService.class);

    @Value("${ML_SERVICE_URL:http://localhost:8001}")
    private String mlServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Blog içeriğinden başlık önerileri al.
     *
     * @param content        Blog içeriği (en az 20 karakter)
     * @param category       Kategori (teknoloji, spor, ekonomi, genel...)
     * @param numSuggestions Kaç öneri isteniyor (1-5)
     * @return Başlık önerilerinin listesi
     */
    public List<String> suggestTitles(String content, String category, int numSuggestions) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

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
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                JsonNode titlesNode = json.get("titles");
                String modelUsed = json.has("model_used") ? json.get("model_used").asText() : "unknown";
                logger.debug("Başlık önerisi alındı (model: {})", modelUsed);

                if (titlesNode != null && titlesNode.isArray()) {
                    List<String> titles = new java.util.ArrayList<>();
                    for (JsonNode t : titlesNode) {
                        titles.add(t.asText());
                    }
                    return titles;
                }
            } else {
                logger.warn("ML service başlık önerisi HTTP {}", response.statusCode());
            }

        } catch (Exception e) {
            logger.warn("ML service başlık önerisi alınamadı, fallback kullanılıyor: {}", e.getMessage());
        }

        return fallbackTitles(content);
    }

    /**
     * Kural tabanlı fallback: içeriğin ilk cümlesini başlık öner.
     */
    private List<String> fallbackTitles(String content) {
        String trimmed = content.trim();

        // İlk nokta/soru/ünlemde böl
        String[] sentences = trimmed.split("[.!?]\\s+");
        String firstSentence = sentences.length > 0 ? sentences[0].trim() : trimmed;

        // Max 100 karakter
        if (firstSentence.length() > 100) {
            firstSentence = firstSentence.substring(0, 100) + "...";
        }

        // İlk 5 kelime
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

package com.aiasistan.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * OpenRouter AI API üzerinden yapay zeka destekli içerik üretimi.
 * Hedef motivasyonu, blog başlık önerisi ve mülakat provası için kullanılır.
 */
@Service
public class OpenRouterAiService {

    private static final Logger logger = LoggerFactory.getLogger(OpenRouterAiService.class);
    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Value("${app.ai.openrouter-key:}")
    private String apiKey;

    @Value("${app.ai.openrouter-model:openai/gpt-oss-120b}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Hedef bilgilerine göre Türkçe motivasyon ve öneri mesajı üretir.
     */
    public String generateGoalMotivation(String title, String description, String category, Integer progressPct) {
        if (!isConfigured()) {
            logger.warn("OpenRouter API key tanımlı değil, fallback motivasyon mesajı kullanılıyor");
            return fallbackMotivation(title, progressPct);
        }

        try {
            int progress = progressPct != null ? progressPct : 0;

            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Türkçe motivasyon mesajı yaz. 2-3 cümle, emoji kullan.\n")
                    .append("Hedef: ").append(title);

            if (description != null && !description.isBlank()) {
                promptBuilder.append(" (").append(description).append(")");
            }
            promptBuilder.append(" | %").append(progress).append(" ilerleme.");

            if (progress >= 100) {
                promptBuilder.append(" Tamamlanmış, tebrik et!");
            }

            String response = callOpenRouter(promptBuilder.toString());
            return response != null ? response : fallbackMotivation(title, progressPct);

        } catch (Exception e) {
            logger.error("Motivasyon mesajı üretilirken hata: {}", e.getMessage());
            return fallbackMotivation(title, progressPct);
        }
    }

    /**
     * Blog içeriğine göre Türkçe başlık önerileri üretir.
     */
    public List<String> generateBlogTitleSuggestions(String content, String category, int count) {
        if (!isConfigured()) {
            logger.warn("OpenRouter API key tanımlı değil, blog başlık önerisi yapılamıyor");
            return List.of();
        }

        try {
            int safeCount = Math.min(Math.max(count, 1), 5);
            String safeCategory = (category == null || category.isBlank()) ? "genel" : category;

            String trimmedContent = content.length() > 1500
                    ? content.substring(0, 1500) + "..."
                    : content;

            String prompt = "Sen bir blog editörüsün. Aşağıdaki blog içeriği için Türkçe olarak "
                    + safeCount + " adet yaratıcı, dikkat çekici ve içerikle uyumlu başlık önerisi yaz.\n\n"
                    + "Kategori: " + safeCategory + "\n\n"
                    + "İçerik:\n" + trimmedContent + "\n\n"
                    + "Kurallar:\n"
                    + "- Her başlık yeni bir satırda olsun\n"
                    + "- Başlıkları numaralandır (1. 2. 3. şeklinde)\n"
                    + "- Başlıklar 5-15 kelime arasında olsun\n"
                    + "- Yaratıcı ve ilgi çekici başlıklar öner\n"
                    + "- Sadece başlıkları yaz, açıklama ekleme";

            String response = callOpenRouter(prompt);
            if (response != null) {
                return parseTitleSuggestions(response, safeCount);
            }

        } catch (Exception e) {
            logger.error("Blog başlık önerisi üretilirken hata: {}", e.getMessage());
        }

        return List.of();
    }

    /**
     * Mülakat başlığı ve iş tanımına göre mülakat soruları üretir.
     */
    public List<String> generateInterviewQuestions(String title, String position, String jobDescription, int count) {
        if (!isConfigured()) {
            logger.warn("OpenRouter API key tanımlı değil, mülakat soruları üretilemiyor");
            return List.of();
        }

        try {
            int safeCount = Math.min(Math.max(count, 3), 10);

            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Sen profesyonel bir İnsan Kaynakları (İK) uzmanısın. ")
                    .append("Aşağıdaki pozisyon için mülakatta sorulacak ").append(safeCount)
                    .append(" adet soru üret.\n\n")
                    .append("Mülakat Başlığı: ").append(title).append("\n")
                    .append("Pozisyon: ").append(position).append("\n");

            if (jobDescription != null && !jobDescription.isBlank()) {
                promptBuilder.append("İş Tanımı: ").append(jobDescription).append("\n");
            }

            promptBuilder.append("\nKurallar:\n")
                    .append("- Sorular Türkçe olsun.\n")
                    .append("- Sorular hem teknik hem de davranışsal (soft skill) yetkinlikleri ölçsün.\n")
                    .append("- Her soru yeni bir satırda olsun ve numaralandır (1. 2. 3. şeklinde).\n")
                    .append("- Sadece soruları yaz, giriş veya açıklama ekleme.");

            String response = callOpenRouter(promptBuilder.toString());
            if (response != null) {
                return parseTitleSuggestions(response, safeCount);
            }

        } catch (Exception e) {
            logger.error("Mülakat soruları üretilirken hata: {}", e.getMessage());
        }

        return List.of();
    }

    /**
     * Tüm mülakat oturumunu analiz eder, genel skor ve geri bildirim üretir.
     */
    public String analyzeInterviewPerformance(String position, List<Map<String, String>> questionAnswerPairs) {
        if (!isConfigured()) {
            return "AI servis yapılandırması eksik olduğu için analiz yapılamadı.";
        }

        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Sen bir mülakat koçusun. Kullanıcının ")
                    .append(position).append(" pozisyonu için verdiği cevapları analiz et.\n\n")
                    .append("Mülakat Akışı:\n");

            for (Map<String, String> pair : questionAnswerPairs) {
                promptBuilder.append("Soru: ").append(pair.get("question")).append("\n")
                        .append("Cevap: ").append(pair.get("answer")).append("\n---\n");
            }

            promptBuilder.append("\nLütfen şu formatta bir değerlendirme yap:\n")
                    .append("1. Genel Değerlendirme (Olumlu ve geliştirilmesi gereken yönler)\n")
                    .append("2. Her soru için kısa teknik/davranışsal geri bildirim\n")
                    .append("3. 100 üzerinden bir başarı skoru (Format: [SKOR: 85])\n\n")
                    .append("Yanıtın nazik, yapıcı ve tamamen Türkçe olsun.");

            return callOpenRouter(promptBuilder.toString());

        } catch (Exception e) {
            logger.error("Mülakat analizi sırasında hata: {}", e.getMessage());
            return "Analiz sırasında bir teknik hata oluştu.";
        }
    }

    /**
     * OpenRouter API'ye istek gönderir ve yanıtı döner.
     */
    private String callOpenRouter(String userMessage) {
        try {
            // OpenAI-compatible chat completions format
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "user", "content", userMessage)),
                    "max_tokens", 250,
                    "temperature", 0.7);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OPENROUTER_API_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("HTTP-Referer", "https://ai-asistan.app")
                    .header("X-Title", "AI Asistan")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode json = objectMapper.readTree(response.body());
                JsonNode choices = json.get("choices");
                if (choices != null && choices.isArray() && !choices.isEmpty()) {
                    JsonNode message = choices.get(0).get("message");
                    if (message != null && message.has("content")) {
                        String content = message.get("content").asText();
                        logger.debug("OpenRouter yanıtı alındı (model: {})", model);
                        return content;
                    }
                }
            } else {
                logger.warn("OpenRouter API HTTP {} — body: {}", response.statusCode(),
                        response.body().length() > 200 ? response.body().substring(0, 200) : response.body());
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("OpenRouter isteği kesintiye uğradı");
        } catch (Exception e) {
            logger.error("OpenRouter API hatası: {}", e.getMessage());
        }

        return null;
    }

    /**
     * AI yanıtından başlık listesi çıkarır.
     */
    private List<String> parseTitleSuggestions(String response, int maxCount) {
        List<String> titles = new ArrayList<>();
        String[] lines = response.split("\n");

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            // Numaralı satırları al: "1. Başlık", "1) Başlık", "- Başlık"
            String cleaned = trimmed.replaceFirst("^\\d+[.)\\-]\\s*", "").trim();
            // Tırnak işaretlerini temizle
            cleaned = cleaned.replaceAll("^\"|\"$", "").trim();
            cleaned = cleaned.replaceAll("^«|»$", "").trim();

            if (!cleaned.isEmpty() && cleaned.length() >= 5 && cleaned.length() <= 200) {
                titles.add(cleaned);
            }

            if (titles.size() >= maxCount) {
                break;
            }
        }

        return titles;
    }

    /**
     * API kullanılamadığında fallback motivasyon mesajları.
     */
    private String fallbackMotivation(String title, Integer progressPct) {
        int progress = progressPct != null ? progressPct : 0;

        if (progress == 0) {
            return "🚀 \"" + title
                    + "\" hedefin harika bir başlangıç! Her büyük yolculuk ilk adımla başlar. Haydi, bugün başla!";
        } else if (progress < 25) {
            return "💪 \"" + title + "\" hedefinde %" + progress
                    + " ilerleme kaydettin! Güzel bir başlangıç yaptın, devam et!";
        } else if (progress < 50) {
            return "🌟 \"" + title + "\" hedefinde %" + progress
                    + "'e ulaştın! Harika gidiyorsun, yarı yola yaklaşıyorsun!";
        } else if (progress < 75) {
            return "🔥 \"" + title + "\" hedefinde %" + progress
                    + "'i geçtin! Yarıdan fazlasını tamamladın, bitiş çizgisi görünüyor!";
        } else if (progress < 100) {
            return "🏆 \"" + title + "\" hedefinde %" + progress + "'e ulaştın! Son düzlüğe girdin, biraz daha!";
        } else {
            return "🎉 Tebrikler! \"" + title + "\" hedefini başarıyla tamamladın! Yeni hedefler seni bekliyor!";
        }
    }

    /**
     * API key tanımlı mı kontrol eder.
     */
    private boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}

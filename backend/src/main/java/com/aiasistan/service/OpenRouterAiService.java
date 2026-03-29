package com.aiasistan.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    public static class QuestionDraft {
        private String text;
        private String difficulty;

        public QuestionDraft() {}
        public QuestionDraft(String text, String difficulty) {
            this.text = text;
            this.difficulty = difficulty;
        }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public String getDifficulty() { return difficulty; }
        public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    }

    private static final Logger logger = LoggerFactory.getLogger(OpenRouterAiService.class);
    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Value("${app.ai.openrouter-key:}")
    private String apiKey;

    @Value("${app.ai.openrouter-model:google/gemini-2.0-flash-exp:free,meta-llama/llama-3.3-70b-instruct:free,mistralai/mistral-7b-instruct:free}")
    private String modelConfig;

    private List<String> getModels() {
        List<String> stableModels = List.of(
            "google/gemini-2.0-flash:free",
            "qwen/qwen-2.5-72b-instruct:free",
            "google/gemma-2-9b-it:free",
            "mistralai/mistral-7b-instruct:free",
            "deepseek/deepseek-chat:free"
        );

        if (modelConfig == null || modelConfig.isBlank()) {
            return stableModels;
        }

        List<String> userModels = Arrays.stream(modelConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank() && !s.equals("openrouter/auto-free"))
                .collect(Collectors.toList());
        
        if (userModels.isEmpty()) return stableModels;
        return userModels;
    }

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
            if (response != null && !response.startsWith("API_ERROR:")) {
                return parseQuestions(response, safeCount);
            } else if (response != null && response.startsWith("API_ERROR:")) {
                throw new RuntimeException("Yapay zeka servisi reddetti: " + response.substring(10));
            }

        } catch (Exception e) {
            logger.error("Blog başlık önerisi üretilirken hata: {}", e.getMessage());
        }

        return List.of();
    }

    /**
     * Mülakat başlığı ve iş tanımına göre mülakat soruları üretir.
     * 1 zor, 2 orta, 2 kolay olmak üzere toplam 5 soru üretir.
     */
    public List<QuestionDraft> generateInterviewQuestions(String title, String position, String jobDescription, int count) {
        if (!isConfigured()) {
            logger.error("OpenRouter API anahtarı (apiKey) tanımlı değil veya boş! Lütfen çevresel değişkenleri (OPENROUTER_API_KEY) kontrol edin.");
            return List.of();
        }

        try {
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append("Sen profesyonel bir İnsan Kaynakları (İK) uzmanı ve teknik mülakatçısın. ")
                    .append("Lütfen aşağıdaki iş başvurusuna özel, adayın bu role uygunluğunu test edecek mülakat soruları üret.\n\n")
                    .append("Mülakat Başlığı: ").append(title).append("\n")
                    .append("Pozisyon: ").append(position).append("\n");

            if (jobDescription != null && !jobDescription.isBlank()) {
                promptBuilder.append("İş Tanımı ve Gereksinimler: ").append(jobDescription).append("\n\nÖNEMLİ: Soruları kalıplaşmış sorulardan ziyade, doğrudan bu iş tanımındaki görevlere, beklenen yetkinliklere ve olası zorlu senaryolara göre özel olarak hazırlala.\n");
            }

            promptBuilder.append("\n\nLütfen bu mülakat için tam olarak 5 adet soru hazırla:\n")
                    .append("- 1 adet ZOR (HARD) teknik/senaryo sorusu\n")
                    .append("- 2 adet ORTA (MEDIUM) teknik soru\n")
                    .append("- 2 adet KOLAY (EASY) genel yetkinlik/başlangıç teknik sorusu\n\n")
                    .append("ÖNEMLİ: Sorular ve yanıtın TAMAMEN TÜRKÇE olsun.\n")
                    .append("ÖNEMLİ: SADECE bir JSON array döndür. Giriş metni, açıklama ASLA ekleme.\n")
                    .append("Format şuna tıpatıp uymalıdır: [{\"text\": \"Soru metni...\", \"difficulty\": \"HARD\"}, ...]");

            String response = callOpenRouter(promptBuilder.toString());
            if (response != null && !response.startsWith("API_ERROR:")) {
                return parseDraftQuestions(response);
            } else if (response != null && response.startsWith("API_ERROR:")) {
                throw new RuntimeException("Yapay zeka servisi reddetti: " + response.substring(10));
            }

        } catch (Exception e) {
            logger.error("Mülakat soruları üretilirken hata: {}", e.getMessage());
            throw new RuntimeException("Mülakat soruları üretilemedi: " + e.getMessage());
        }

        throw new RuntimeException("Geçerli bir API anahtarı veya kota bulunamadı. Lütfen backend çevresel değişkenlerini (OPENROUTER_API_KEY) kontrol edin.");
    }

    private List<QuestionDraft> parseDraftQuestions(String response) {
        List<QuestionDraft> drafts = new ArrayList<>();
        String content = response.trim();

        int startIndex = content.indexOf("[");
        int endIndex = content.lastIndexOf("]");
        
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            String jsonPart = content.substring(startIndex, endIndex + 1);
            try {
                JsonNode node = objectMapper.readTree(jsonPart);
                if (node.isArray()) {
                    for (JsonNode item : node) {
                        String text = item.path("text").asText().trim();
                        String diff = item.path("difficulty").asText("MEDIUM").trim().toUpperCase();
                        if (!text.isEmpty()) {
                            drafts.add(new QuestionDraft(text, diff));
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("JSON ayrıştırma hatası: {}", e.getMessage());
            }
        }
        
        if (drafts.isEmpty()) {
            // Fallback for non-JSON or malformed
            List<String> plain = parseQuestions(response, 5);
            for (int i = 0; i < plain.size(); i++) {
                String diff = (i == 0) ? "HARD" : (i < 3 ? "MEDIUM" : "EASY");
                drafts.add(new QuestionDraft(plain.get(i), diff));
            }
        }
        return drafts;
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

            promptBuilder.append("\nSen bir kıdemli teknik mülakatçı, CTO ve kariyer koçusun. Lütfen şu yapıda **MÜMKÜN OLAN EN DETAYLI** değerlendirmeyi yap:\n")
                    .append("1. **Soru Bazlı Analiz ve Puanlama**: Her bir soru için (sorunun Zorluk seviyesini de dikkate alarak):\n")
                    .append("   - Cevabın doğruluğunu, teknik derinliğini ve eksiklerini açıkla.\n")
                    .append("   - Bu cevaba 100 üzerinden bir puan ver.\n")
                    .append("   - Zor soruların puanlanmasında daha toleranslı olabilirsin, ancak teknik derinlik beklemelisin.\n")
                    .append("   - Format: [SORU_SKOR: 80], [SORU_FEEDBACK: ...]\n")
                    .append("2. **Genel Değerlendirme**: Adayın profilini ve iletişim becerilerini özetle.\n")
                    .append("3. **Başarı Skoru**: Tüm mülakat için 100 üzerinden bir toplam puan (Format: [TOTAL_SKOR: 85])\n\n")
                    .append("ÖNEMLİ: Her soru için teknik detaylara doygun geri bildirim ver. Yanıtın tamamen Türkçe olsun.");

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
        if (!isConfigured()) {
            logger.error("callOpenRouter: API anahtarı eksik.");
            return null;
        }
        
        List<String> modelsToTry = getModels();
        logger.info("OpenRouter isteği başlatılıyor. Denenecek model sayısı: {}. Anahtar uzunluğu: {}", 
                modelsToTry.size(), apiKey.length());
        
        String lastError = null;

        for (String currentModel : modelsToTry) {
            String sanitizedModel = currentModel.trim();
            try {
                logger.info("OpenRouter isteği gönderiliyor (model: {})", sanitizedModel);
                
                // OpenAI-compatible chat completions format
                Map<String, Object> requestBody = Map.of(
                        "model", sanitizedModel,
                        "messages", List.of(
                                Map.of("role", "user", "content", userMessage)),
                        "max_tokens", 4000,
                        "temperature", 0.7);

                String jsonBody = objectMapper.writeValueAsString(requestBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(OPENROUTER_API_URL))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + apiKey)
                        .header("HTTP-Referer", "https://ai-asistan.app")
                        .header("X-Title", "AI Asistan")
                        .timeout(Duration.ofSeconds(120))
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
                            logger.info("OpenRouter yanıtı başarıyla alındı (model: {})", sanitizedModel);
                            return content;
                        }
                    }
                } else {
                    String errorBody = response.body();
                    logger.warn("OpenRouter API {} hatası (model: {}). Yanıt: {}", 
                            response.statusCode(), sanitizedModel, errorBody);
                    
                    if (response.statusCode() == 401 || response.statusCode() == 403 || response.statusCode() == 402) {
                        return "API_ERROR: HTTP " + response.statusCode() + " - Yetersiz bakiye veya geçersiz API anahtarı.";
                    } else if (response.statusCode() == 404 || response.statusCode() == 429 || response.statusCode() == 400) {
                        lastError = "HTTP " + response.statusCode() + " (" + sanitizedModel + ") -> " + errorBody;
                    } else {
                        return "API_ERROR: HTTP " + response.statusCode() + " - Beklenmeyen hata: " + errorBody;
                    }
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.error("OpenRouter isteği kesintiye uğradı");
                break;
            } catch (Exception e) {
                logger.error("OpenRouter API hatası (model: {}): {}", sanitizedModel, e.getMessage(), e);
                lastError = (e.getMessage() != null) ? e.getMessage() : e.toString();
            }
            
            logger.warn("Model {} başarısız oldu, bir sonraki deneniyor...", sanitizedModel);
        }

        return "API_ERROR: Tüm modeller (404/429/400) reddetti. Son denenen modelin hatası: " + (lastError != null ? lastError : "Bilinmiyor");
    }

    /**
     * AI yanıtından başlık listesi çıkarır.
     */
    private List<String> parseQuestions(String response, int maxCount) {
        List<String> questions = new ArrayList<>();
        String content = response.trim();

        // 1. JSON Array tespiti (Metin içinden ayıkla)
        int startIndex = content.indexOf("[");
        int endIndex = content.lastIndexOf("]");
        
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            String jsonPart = content.substring(startIndex, endIndex + 1);
            try {
                JsonNode node = objectMapper.readTree(jsonPart);
                if (node.isArray()) {
                    for (JsonNode item : node) {
                        String q = item.asText().trim();
                        // Giriş cümlelerini filtrele (Örn: "İşte sorularınız:", "Mülakat Soruları")
                        if (!q.isEmpty() && !q.toLowerCase().contains("hazırladım") && !q.endsWith(":")) {
                            questions.add(q);
                        }
                    }
                    if (!questions.isEmpty()) return questions;
                }
            } catch (Exception e) {
                logger.warn("JSON ayrıştırma hatası, fallback moduna geçiliyor: {}", e.getMessage());
            }
        }

        String[] lines = content.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            // Giriş cümlelerini (header/intro) filtrele
            if (trimmed.endsWith(":") || trimmed.toLowerCase().contains("hazırladım") || 
                trimmed.toLowerCase().contains("sorular şunlardır") || trimmed.length() < 10) {
                continue;
            }

            // Numarayı temizle: "1. Soru", "1) Soru", "- Soru"
            String cleaned = trimmed.replaceFirst("^\\d+[.)\\\\-]\\s*", "").trim();
            // Tırnakları temizle
            cleaned = cleaned.replaceAll("^[\"«'']|[\"»'']$", "").trim();

            if (!cleaned.isEmpty() && cleaned.length() >= 5) {
                questions.add(cleaned);
            }
            if (questions.size() >= maxCount) break;
        }

        if (questions.isEmpty()) {
            throw new RuntimeException("Yapay zeka yanıtı anlaşılamadı veya boş. Yanıt: " + 
                (content.length() > 50 ? content.substring(0, 50) + "..." : content));
        }
        return questions;
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

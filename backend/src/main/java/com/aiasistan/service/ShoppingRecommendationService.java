/**
 * Kisa aciklama: Alisveris onerisi icin ML servis entegrasyonu ve fallback.
 */

package com.aiasistan.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.ShoppingRecommendationDto;
import com.aiasistan.model.ShoppingItem;
import com.aiasistan.repository.ShoppingItemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ShoppingRecommendationService {
    private static final Logger logger = LoggerFactory.getLogger(ShoppingRecommendationService.class);

    @Value("${ML_SERVICE_URL:http://localhost:8001}")
    private String mlServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ShoppingItemRepository shoppingItemRepository;
    private final UserService userService;

    public ShoppingRecommendationService(ShoppingItemRepository shoppingItemRepository, UserService userService) {
        this.shoppingItemRepository = shoppingItemRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<ShoppingRecommendationDto.Response> getRecommendations(
            String userEmail,
            UUID listId,
            int topK) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        List<ShoppingItem> allItems = shoppingItemRepository.findAll();
        if (allItems.isEmpty()) {
            return List.of();
        }

        if (tryEnsureMlModel(allItems)) {
            List<ShoppingRecommendationDto.Response> mlResponse = fetchFromMl(userId, topK);
            if (!mlResponse.isEmpty()) {
                logger.info("Shopping recommendations fetched from ML for userId={}, count={}", userId,
                        mlResponse.size());
                return filterForList(mlResponse, listId, topK);
            }
        }

        logger.info("Shopping ML recommendation fallback is used for userId={} (allItems={})", userId, allItems.size());
        return localFallback(userId, allItems, listId, topK);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> trainModelFromDatabase(String userEmail) {
        userService.getUserIdByEmail(userEmail);
        List<ShoppingItem> allItems = shoppingItemRepository.findAll();
        if (allItems.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "Egitim icin shopping verisi bulunamadi.");
        }
        boolean trained = trainRemoteModel(allItems);
        boolean loaded = reloadRemoteModel();
        return Map.of(
                "success", trained && loaded,
                "trained", trained,
                "loaded", loaded,
                "interactionCount", allItems.size());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRecommendationMetrics(String userEmail, int topK, int maxUsers) {
        userService.getUserIdByEmail(userEmail);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(
                            mlServiceUrl
                                    + "/api/shopping/recommendations/metrics?top_k="
                                    + topK
                                    + "&max_users="
                                    + maxUsers))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Map.of(
                        "success", false,
                        "status", response.statusCode(),
                        "message", "ML service metrics endpoint cagrisinda hata.");
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode dataNode = root.get("data");
            if (dataNode == null || dataNode.isNull()) {
                return Map.of(
                        "success", false,
                        "message", "ML service metrics verisi bos dondu.");
            }
            return objectMapper.convertValue(dataNode, Map.class);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return Map.of("success", false, "message", "Metrics istegi kesintiye ugradi.");
        } catch (Exception ex) {
            return Map.of("success", false, "message", "Metrics alinmadi: " + ex.getMessage());
        }
    }

    private boolean tryEnsureMlModel(List<ShoppingItem> items) {
        if (reloadRemoteModel()) {
            return true;
        }
        if (!trainRemoteModel(items)) {
            return false;
        }
        return reloadRemoteModel();
    }

    private boolean trainRemoteModel(List<ShoppingItem> allItems) {
        try {
            List<Map<String, Object>> interactions = allItems.stream()
                    .map(this::toInteractionPayload)
                    .toList();
            String body = objectMapper.writeValueAsString(Map.of("interactions", interactions));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/shopping/recommendations/train"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return true;
            }
            logger.warn("Shopping model train failed. status={} body={}", response.statusCode(), response.body());
            return false;
        } catch (Exception ex) {
            logger.warn("Shopping model train call failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean reloadRemoteModel() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/api/shopping/recommendations/reload"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception ex) {
            logger.warn("Shopping model reload call failed: {}", ex.getMessage());
            return false;
        }
    }

    private List<ShoppingRecommendationDto.Response> fetchFromMl(UUID userId, int topK) {
        try {
            String encodedUserId = URLEncoder.encode(userId.toString(), StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(
                            mlServiceUrl + "/api/shopping/recommendations/user/" + encodedUserId + "?top_k=" + topK))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.warn("Shopping recommendation call failed. status={} body={}", response.statusCode(),
                        response.body());
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode dataNode = root.get("data");
            if (dataNode == null || !dataNode.isArray()) {
                return List.of();
            }

            List<ShoppingRecommendationDto.Response> out = new ArrayList<>();
            for (JsonNode node : dataNode) {
                ShoppingRecommendationDto.Response recommendation = new ShoppingRecommendationDto.Response();
                recommendation.setProductKey(node.path("productKey").asText(null));
                recommendation.setItemName(node.path("itemName").asText(null));
                recommendation.setCategory(node.path("category").asText(null));
                recommendation.setScore(node.path("score").isMissingNode() ? 0.0 : node.path("score").asDouble(0.0));
                List<String> reasons = new ArrayList<>();
                JsonNode reasonsNode = node.get("reasons");
                if (reasonsNode != null && reasonsNode.isArray()) {
                    for (JsonNode reason : reasonsNode) {
                        reasons.add(reason.asText());
                    }
                }
                recommendation.setReasons(reasons);
                if (recommendation.getProductKey() != null && !recommendation.getProductKey().isBlank()) {
                    out.add(recommendation);
                }
            }
            return out;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            logger.warn("Shopping recommendation fetch interrupted: {}", ex.getMessage());
            return List.of();
        } catch (IOException ex) {
            logger.warn("Shopping recommendation fetch failed: {}", ex.getMessage());
            return List.of();
        } catch (Exception ex) {
            logger.warn("Shopping recommendation parse failed: {}", ex.getMessage());
            return List.of();
        }
    }

    private List<ShoppingRecommendationDto.Response> filterForList(
            List<ShoppingRecommendationDto.Response> recommendations,
            UUID listId,
            int topK) {
        if (listId == null) {
            return recommendations.stream().limit(topK).toList();
        }
        Set<String> existing = shoppingItemRepository.findByList_Id(listId, Pageable.unpaged())
                .getContent()
                .stream()
                .map(ShoppingItem::getProductKey)
                .filter(k -> k != null && !k.isBlank())
                .collect(Collectors.toSet());

        return recommendations.stream()
                .filter(r -> r.getProductKey() != null && !existing.contains(r.getProductKey()))
                .limit(topK)
                .toList();
    }

    private List<ShoppingRecommendationDto.Response> localFallback(
            UUID userId,
            List<ShoppingItem> allItems,
            UUID listId,
            int topK) {
        List<ShoppingItem> checked = allItems.stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsChecked()))
                .filter(i -> i.getProductKey() != null && !i.getProductKey().isBlank())
                .toList();

        if (checked.isEmpty()) {
            // Hiç satin alinan yoksa, en azindan daha once listeye eklenenleri dikkate al
            checked = allItems.stream()
                    .filter(i -> i.getProductKey() != null && !i.getProductKey().isBlank())
                    .toList();
        }

        if (checked.isEmpty()) {
            return List.of();
        }

        Map<String, Long> globalFrequency = checked.stream()
                .collect(Collectors.groupingBy(ShoppingItem::getProductKey, Collectors.counting()));

        List<ShoppingItem> userChecked = checked.stream()
                .filter(i -> userId.equals(i.getList().getUserId()))
                .toList();

        Set<String> listExisting = new HashSet<>();
        if (listId != null) {
            listExisting = shoppingItemRepository.findByList_Id(listId, Pageable.unpaged())
                    .getContent()
                    .stream()
                    .map(ShoppingItem::getProductKey)
                    .filter(k -> k != null && !k.isBlank())
                    .collect(Collectors.toSet());
        }

        Map<String, Double> score = new HashMap<>();
        Map<String, String> names = new HashMap<>();
        Map<String, String> categories = new HashMap<>();
        for (ShoppingItem item : checked) {
            names.putIfAbsent(item.getProductKey(), item.getName());
            categories.putIfAbsent(item.getProductKey(), item.getCategory());
        }

        long maxGlobal = globalFrequency.values().stream().max(Long::compareTo).orElse(1L);
        for (Map.Entry<String, Long> entry : globalFrequency.entrySet()) {
            score.put(entry.getKey(), entry.getValue() / (double) maxGlobal);
        }

        Map<String, List<OffsetDateTime>> userTimes = userChecked.stream()
                .filter(i -> i.getCheckedAt() != null)
                .collect(Collectors.groupingBy(
                        ShoppingItem::getProductKey,
                        Collectors.mapping(ShoppingItem::getCheckedAt, Collectors.toList())));
        OffsetDateTime now = OffsetDateTime.now();
        for (Map.Entry<String, List<OffsetDateTime>> entry : userTimes.entrySet()) {
            List<OffsetDateTime> times = entry.getValue();
            times.sort(Comparator.naturalOrder());
            if (times.isEmpty()) {
                continue;
            }
            OffsetDateTime last = times.get(times.size() - 1);
            long sinceLast = Math.max(0, ChronoUnit.DAYS.between(last, now));
            double dueBoost = Math.min(1.5, sinceLast / 7.0);
            score.merge(entry.getKey(), dueBoost, Double::sum);
        }

        List<String> userRecentProducts = userChecked.stream()
                .sorted(Comparator.comparing(ShoppingItem::getCheckedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(ShoppingItem::getProductKey)
                .filter(k -> k != null && !k.isBlank())
                .toList();
        Set<String> recentSet = new HashSet<>(userRecentProducts);
        for (String productKey : recentSet) {
            score.remove(productKey);
        }
        for (String productKey : listExisting) {
            score.remove(productKey);
        }

        if (score.isEmpty() && !listExisting.isEmpty()) {
            // Eğer her şey filtrelendiyse, listedekileri çok düşük puanla geri getir (hiç
            // yoktan iyidir)
            for (String pk : listExisting) {
                if (names.containsKey(pk)) {
                    score.put(pk, 0.01);
                }
            }
        }

        logger.info("Local fallback generated {} candidates for userId={}", score.size(), userId);

        return score.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(topK)
                .map(entry -> {
                    ShoppingRecommendationDto.Response response = new ShoppingRecommendationDto.Response();
                    response.setProductKey(entry.getKey());
                    response.setItemName(names.getOrDefault(entry.getKey(), entry.getKey()));
                    response.setCategory(normalizeCategory(categories.get(entry.getKey())));
                    response.setScore(entry.getValue());
                    response.setReasons(Collections.singletonList("fallback_popularity"));
                    return response;
                })
                .toList();
    }

    private Map<String, Object> toInteractionPayload(ShoppingItem item) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("user_id", item.getList().getUserId().toString());
        payload.put("list_id", item.getListId().toString());
        payload.put("item_id", item.getId().toString());
        payload.put("item_name", item.getName());
        payload.put("product_key", item.getProductKey());
        payload.put("category", normalizeCategory(item.getCategory()));
        payload.put("is_checked", Boolean.TRUE.equals(item.getIsChecked()));
        payload.put("quantity", item.getQuantity());
        payload.put("unit", item.getUnit());
        payload.put("estimated_price_minor", item.getEstimatedPriceMinor());
        payload.put("added_at", item.getAddedAt() != null ? item.getAddedAt().toString() : null);
        payload.put("checked_at", item.getCheckedAt() != null ? item.getCheckedAt().toString() : null);
        payload.put(
                "list_created_at",
                item.getList().getCreatedAt() != null ? item.getList().getCreatedAt().toString() : null);
        payload.put("recurrence_type", item.getList().getRecurrenceType());
        return payload;
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "GENEL";
        }
        return category.trim().toUpperCase(Locale.ROOT);
    }
}

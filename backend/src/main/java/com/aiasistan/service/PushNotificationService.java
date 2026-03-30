package com.aiasistan.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.aiasistan.model.User;
import com.aiasistan.model.UserPushToken;
import com.aiasistan.repository.UserPushTokenRepository;
import com.aiasistan.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PushNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);

    private final UserPushTokenRepository userPushTokenRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final boolean enabled;
    private final String expoUrl;

    public PushNotificationService(
            UserPushTokenRepository userPushTokenRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper,
            @Value("${app.push.enabled:true}") boolean enabled,
            @Value("${app.push.expo-url:https://exp.host/--/api/v2/push/send}") String expoUrl) {
        this.userPushTokenRepository = userPushTokenRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.expoUrl = expoUrl;
        this.restTemplate = new RestTemplate();
    }

    @Transactional
    public void sendFollowRequestNotification(UUID targetUserId, UUID requesterUserId) {
        if (targetUserId == null || requesterUserId == null || targetUserId.equals(requesterUserId)) {
            return;
        }
        String requesterName = resolveDisplayName(requesterUserId);
        sendToUser(
                targetUserId,
                "Yeni Takip Istegi",
                requesterName + " size takip istegi gonderdi.",
                Map.of(
                        "type", "follow_request",
                        "requesterUserId", requesterUserId.toString()));
    }

    @Transactional
    public void sendBlogLikeNotification(UUID postOwnerUserId, UUID actorUserId, String postTitle) {
        if (postOwnerUserId == null || actorUserId == null || postOwnerUserId.equals(actorUserId)) {
            return;
        }
        String actorName = resolveDisplayName(actorUserId);
        String normalizedPostTitle = postTitle == null ? "" : postTitle.trim();
        String suffix = normalizedPostTitle.isBlank() ? "gonderinizi begendi."
                : ("\"" + normalizedPostTitle + "\" gonderinizi begendi.");
        sendToUser(
                postOwnerUserId,
                "Yeni Begeni",
                actorName + " " + suffix,
                Map.of(
                        "type", "blog_like",
                        "actorUserId", actorUserId.toString()));
    }

    @Transactional
    public void sendBlogCommentNotification(UUID postOwnerUserId, UUID actorUserId, String postTitle) {
        if (postOwnerUserId == null || actorUserId == null || postOwnerUserId.equals(actorUserId)) {
            return;
        }
        String actorName = resolveDisplayName(actorUserId);
        String normalizedPostTitle = postTitle == null ? "" : postTitle.trim();
        String suffix = normalizedPostTitle.isBlank() ? "gonderinize yorum yapti."
                : ("\"" + normalizedPostTitle + "\" gonderinize yorum yapti.");
        sendToUser(
                postOwnerUserId,
                "Yeni Yorum",
                actorName + " " + suffix,
                Map.of(
                        "type", "blog_comment",
                        "actorUserId", actorUserId.toString()));
    }

    @Transactional
    public void sendShoppingReminder(UUID userId, String itemName) {
        sendToUser(
                userId,
                "Alisveris Hatirlaticisi",
                itemName + " bitmis olabilir. Alisveris listenize eklemek ister misiniz?",
                Map.of(
                        "type", "shopping_reminder",
                        "itemName", itemName,
                        "screen", "/(shopping)/lists",
                        "params", Map.of(
                                "addItem", itemName
                        )));
    }

    @Transactional
    protected void sendToUser(UUID userId, String title, String body, Map<String, Object> data) {
        if (!enabled || userId == null) {
            return;
        }
        List<UserPushToken> tokens = userPushTokenRepository.findByUserIdAndIsActiveTrueAndDeletedAtIsNull(userId);
        if (tokens.isEmpty()) {
            return;
        }

        List<Map<String, Object>> messages = new ArrayList<>();
        for (UserPushToken token : tokens) {
            Map<String, Object> message = new HashMap<>();
            message.put("to", token.getToken());
            message.put("title", title);
            message.put("body", body);
            message.put("sound", "default");
            message.put("data", data != null ? data : Map.of());
            messages.add(message);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<List<Map<String, Object>>> request = new HttpEntity<>(messages, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(expoUrl, request, String.class);
            processExpoResponse(tokens, response.getBody());
        } catch (Exception ex) {
            logger.warn("Push notification gonderilemedi: {}", ex.getMessage());
        }
    }

    private void processExpoResponse(List<UserPushToken> tokens, String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return;
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode dataArray = root.path("data");
            if (!dataArray.isArray()) {
                return;
            }
            int size = Math.min(tokens.size(), dataArray.size());
            for (int i = 0; i < size; i++) {
                JsonNode entry = dataArray.get(i);
                String status = entry.path("status").asText("");
                String error = entry.path("details").path("error").asText("");
                if ("error".equalsIgnoreCase(status) && "DeviceNotRegistered".equalsIgnoreCase(error)) {
                    UserPushToken token = tokens.get(i);
                    token.setIsActive(false);
                    userPushTokenRepository.save(token);
                }
            }
        } catch (Exception ex) {
            logger.debug("Expo response parse edilemedi: {}", ex.getMessage());
        }
    }

    private String resolveDisplayName(UUID userId) {
        return userRepository.findById(userId)
                .map(this::displayName)
                .orElse("Bir kullanici");
    }

    private String displayName(User user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String name = (firstName + " " + lastName).trim();
        return name.isBlank() ? user.getEmail() : name;
    }
}

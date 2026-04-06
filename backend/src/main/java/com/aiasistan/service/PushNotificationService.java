package com.aiasistan.service;

import com.aiasistan.model.User;
import com.aiasistan.model.UserPushToken;
import com.aiasistan.repository.UserPushTokenRepository;
import com.aiasistan.repository.UserRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.AndroidConfig.Priority;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PushNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(PushNotificationService.class);

    private final UserPushTokenRepository tokenRepository;
    private final UserRepository userRepository;

    public PushNotificationService(UserPushTokenRepository tokenRepository, UserRepository userRepository) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    public void sendPushNotification(UUID userId, String title, String body, Map<String, ?> data) {
        if (userId == null) {
            return;
        }

        List<UserPushToken> tokens = tokenRepository.findByUserIdAndIsActiveTrue(userId);
        if (tokens.isEmpty()) {
            logger.debug("No active push token found for user {}", userId);
            return;
        }

        Map<String, String> normalizedData = normalizeData(data);
        for (UserPushToken token : tokens) {
            sendToFcm(token.getToken(), title, body, normalizedData);
        }
    }

    private void sendToFcm(String targetToken, String title, String body, Map<String, String> data) {
        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message.Builder messageBuilder = Message.builder()
                    .setToken(targetToken)
                    .setNotification(notification)
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setChannelId("default")
                                    .build())
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            logger.debug("FCM notification sent: {}", response);
        } catch (Exception e) {
            logger.warn("FCM send failed for token {}: {}", targetToken, e.getMessage());
            if (isInvalidTokenError(e)) {
                deactivateToken(targetToken);
            }
        }
    }

    public void sendToUser(UUID userId, String title, String body, Map<String, ?> data) {
        sendPushNotification(userId, title, body, data);
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
        String safeItemName = itemName == null ? "urun" : itemName;
        sendToUser(
                userId,
                "Alisveris Hatirlaticisi",
                safeItemName + " bitmis olabilir. Alisveris listenize eklemek ister misiniz?",
                Map.of(
                        "type", "shopping_reminder",
                        "itemName", safeItemName,
                        "screen", "/(shopping)/lists"));
    }

    @Transactional
    public void deactivateToken(String token) {
        tokenRepository.findByToken(token).ifPresent(t -> {
            t.setIsActive(false);
            tokenRepository.save(t);
            logger.info("Invalid push token deactivated");
        });
    }

    @Transactional
    public void deactivateUserTokens(UUID userId) {
        List<UserPushToken> tokens = tokenRepository.findByUserIdAndIsActiveTrue(userId);
        for (UserPushToken t : tokens) {
            t.setIsActive(false);
        }
        tokenRepository.saveAll(tokens);
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

    private Map<String, String> normalizeData(Map<String, ?> data) {
        if (data == null || data.isEmpty()) {
            return Map.of();
        }

        return data.entrySet().stream()
                .filter(e -> e.getKey() != null && !e.getKey().isBlank() && e.getValue() != null)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> Objects.toString(e.getValue(), "")));
    }

    private boolean isInvalidTokenError(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return false;
        }

        String lower = message.toLowerCase();
        return lower.contains("registration-token-not-registered")
                || lower.contains("requested entity was not found")
                || lower.contains("invalid registration token");
    }
}

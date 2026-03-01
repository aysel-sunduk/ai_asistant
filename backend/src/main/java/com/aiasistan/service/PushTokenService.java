package com.aiasistan.service;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.dto.request.PushTokenUpsertRequest;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.model.UserPushToken;
import com.aiasistan.repository.UserPushTokenRepository;

@Service
public class PushTokenService {

    private final UserService userService;
    private final UserPushTokenRepository userPushTokenRepository;

    public PushTokenService(UserService userService, UserPushTokenRepository userPushTokenRepository) {
        this.userService = userService;
        this.userPushTokenRepository = userPushTokenRepository;
    }

    @Transactional
    public Map<String, Object> upsertPushToken(String userEmail, PushTokenUpsertRequest request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        String normalizedToken = normalizePushToken(request.getPushToken());
        String normalizedPlatform = normalizeOptional(request.getPlatform());
        String normalizedDeviceId = normalizeOptional(request.getDeviceId());

        UserPushToken token = userPushTokenRepository.findByToken(normalizedToken).orElseGet(UserPushToken::new);
        token.setUserId(userId);
        token.setToken(normalizedToken);
        token.setPlatform(normalizedPlatform);
        token.setDeviceId(normalizedDeviceId);
        token.setIsActive(true);
        token.setDeletedAt(null);
        token.setLastSeenAt(OffsetDateTime.now());

        UserPushToken saved = userPushTokenRepository.save(token);
        return Map.of(
            "id", saved.getId(),
            "pushToken", saved.getToken(),
            "userId", saved.getUserId(),
            "isActive", Boolean.TRUE.equals(saved.getIsActive())
        );
    }

    private String normalizePushToken(String pushToken) {
        if (pushToken == null || pushToken.isBlank()) {
            throw new BadRequestException("pushToken zorunludur");
        }
        String token = pushToken.trim();
        String lower = token.toLowerCase(Locale.ROOT);
        boolean expoFormat = lower.startsWith("expopushtoken[") || lower.startsWith("exponentpushtoken[");
        if (!expoFormat) {
            throw new BadRequestException("Gecersiz Expo push token formati");
        }
        return token;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}

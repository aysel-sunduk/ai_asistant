package com.aiasistan.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aiasistan.model.UserPushToken;

public interface UserPushTokenRepository extends JpaRepository<UserPushToken, UUID> {
    Optional<UserPushToken> findByToken(String token);

    List<UserPushToken> findByUserIdAndIsActiveTrueAndDeletedAtIsNull(UUID userId);
}

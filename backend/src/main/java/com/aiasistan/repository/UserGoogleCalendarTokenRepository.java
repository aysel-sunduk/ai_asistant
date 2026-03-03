package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.UserGoogleCalendarToken;

@Repository
public interface UserGoogleCalendarTokenRepository extends JpaRepository<UserGoogleCalendarToken, UUID> {

    Optional<UserGoogleCalendarToken> findByUserId(UUID userId);
}

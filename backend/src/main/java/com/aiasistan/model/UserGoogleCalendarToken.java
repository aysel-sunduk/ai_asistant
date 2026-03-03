package com.aiasistan.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.Where;

import com.aiasistan.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_google_calendar_tokens")
@Where(clause = "deleted_at IS NULL")
public class UserGoogleCalendarToken extends BaseEntity {

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "access_token", nullable = false, columnDefinition = "text")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "text")
    private String refreshToken;

    @Column(name = "token_type", length = 64)
    private String tokenType;

    @Column(name = "scope", columnDefinition = "text")
    private String scope;

    @Column(name = "expires_at", columnDefinition = "timestamptz")
    private OffsetDateTime expiresAt;

    @Column(name = "selected_calendar_id", length = 255)
    private String selectedCalendarId;

    @Column(name = "selected_calendar_summary", length = 255)
    private String selectedCalendarSummary;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(String scope) {
        this.scope = scope;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getSelectedCalendarId() {
        return selectedCalendarId;
    }

    public void setSelectedCalendarId(String selectedCalendarId) {
        this.selectedCalendarId = selectedCalendarId;
    }

    public String getSelectedCalendarSummary() {
        return selectedCalendarSummary;
    }

    public void setSelectedCalendarSummary(String selectedCalendarSummary) {
        this.selectedCalendarSummary = selectedCalendarSummary;
    }
}

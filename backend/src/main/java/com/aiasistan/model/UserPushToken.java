package com.aiasistan.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.Where;

import com.aiasistan.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "user_push_tokens",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_push_tokens_token", columnNames = "token")
    }
)
@Where(clause = "deleted_at IS NULL")
public class UserPushToken extends BaseEntity {

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "token", nullable = false, length = 255)
    private String token;

    @Column(name = "platform", length = 64)
    private String platform;

    @Column(name = "device_id", length = 128)
    private String deviceId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "last_seen_at", columnDefinition = "timestamptz")
    private OffsetDateTime lastSeenAt;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public OffsetDateTime getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(OffsetDateTime lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }
}

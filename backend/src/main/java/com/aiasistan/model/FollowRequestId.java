package com.aiasistan.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class FollowRequestId implements Serializable {

    @Column(name = "requester_id", nullable = false, columnDefinition = "uuid")
    private UUID requesterId;

    @Column(name = "target_id", nullable = false, columnDefinition = "uuid")
    private UUID targetId;

    public FollowRequestId() {
    }

    public FollowRequestId(UUID requesterId, UUID targetId) {
        this.requesterId = requesterId;
        this.targetId = targetId;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(UUID requesterId) {
        this.requesterId = requesterId;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public void setTargetId(UUID targetId) {
        this.targetId = targetId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FollowRequestId that)) return false;
        return Objects.equals(requesterId, that.requesterId) && Objects.equals(targetId, that.targetId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(requesterId, targetId);
    }
}

package com.aiasistan.common;

import jakarta.persistence.*;

import java.util.UUID;

/**
 * Kullanıcıya ait verileri tutan entity'ler için base sınıf.
 * Her modül kendi user_id ilişkisini kendisi yönetir.
 */
@MappedSuperclass
public abstract class UserOwnedEntity extends BaseEntity {
    
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }
}

package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aiasistan.model.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    Page<User> findByIdNotAndIsActiveTrueAndDeletedAtIsNullAndVisibilityIn(
        UUID currentUserId,
        List<String> visibility,
        Pageable pageable
    );

    @Query("""
        SELECT u
        FROM User u
        WHERE u.id <> :currentUserId
          AND u.isActive = true
          AND u.deletedAt IS NULL
          AND lower(coalesce(u.visibility, 'public')) IN ('public', 'private')
          AND (
              lower(u.email) LIKE lower(concat('%', :q, '%'))
              OR lower(coalesce(u.firstName, '')) LIKE lower(concat('%', :q, '%'))
              OR lower(coalesce(u.lastName, '')) LIKE lower(concat('%', :q, '%'))
              OR lower(concat(coalesce(u.firstName, ''), ' ', coalesce(u.lastName, ''))) LIKE lower(concat('%', :q, '%'))
          )
        """)
    Page<User> findDiscoverablePublicUsers(
        @Param("currentUserId") UUID currentUserId,
        @Param("q") String q,
        Pageable pageable
    );
}

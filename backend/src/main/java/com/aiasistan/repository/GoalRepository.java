/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.Goal;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    Page<Goal> findByUserId(UUID userId, Pageable pageable);

    Page<Goal> findByUserIdAndIsCompleted(UUID userId, Boolean isCompleted, Pageable pageable);

    Optional<Goal> findByIdAndUserId(UUID id, UUID userId);
}
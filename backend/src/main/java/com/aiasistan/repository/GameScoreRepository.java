package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.GameScore;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, UUID> {

    Page<GameScore> findByUserId(UUID userId, Pageable pageable);

    Optional<GameScore> findByIdAndUserId(UUID id, UUID userId);

    Page<GameScore> findByGameKeyOrderByScoreDesc(String gameKey, Pageable pageable);
}

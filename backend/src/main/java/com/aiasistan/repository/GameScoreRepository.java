package com.aiasistan.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.GameScore;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, UUID> {

    Page<GameScore> findByUserId(UUID userId, Pageable pageable);

    Optional<GameScore> findByIdAndUserId(UUID id, UUID userId);

    Page<GameScore> findByGameKeyOrderByScoreDesc(String gameKey, Pageable pageable);

    Page<GameScore> findByGameKeyAndUserIdInOrderByScoreDesc(String gameKey, List<UUID> userIds, Pageable pageable);

    @Query("SELECT MAX(g.score) FROM GameScore g WHERE g.gameKey = :gameKey AND g.userId = :userId")
    Integer findBestScoreByGameKeyAndUserId(@Param("gameKey") String gameKey, @Param("userId") UUID userId);

    @Query("""
        SELECT COUNT(DISTINCT g.userId)
        FROM GameScore g
        WHERE g.gameKey = :gameKey
        """)
    long countPlayersByGameKey(@Param("gameKey") String gameKey);

    @Query(value = """
        SELECT COUNT(*) + 1
        FROM (
            SELECT user_id, MAX(score) AS best_score
            FROM game_scores
            WHERE game_key = :gameKey
            GROUP BY user_id
        ) t
        WHERE t.best_score > :score
        """, nativeQuery = true)
    long calculateGlobalRankByBestScore(@Param("gameKey") String gameKey, @Param("score") Integer score);

    @Query(value = """
        SELECT COUNT(*)
        FROM (
            SELECT user_id
            FROM game_scores
            WHERE game_key = :gameKey AND user_id IN (:userIds)
            GROUP BY user_id
        ) t
        """, nativeQuery = true)
    long countPlayersByGameKeyAndUserIds(@Param("gameKey") String gameKey, @Param("userIds") List<UUID> userIds);

    @Query(value = """
        SELECT COUNT(*) + 1
        FROM (
            SELECT user_id, MAX(score) AS best_score
            FROM game_scores
            WHERE game_key = :gameKey AND user_id IN (:userIds)
            GROUP BY user_id
        ) t
        WHERE t.best_score > :score
        """, nativeQuery = true)
    long calculateFriendsRankByBestScore(
        @Param("gameKey") String gameKey,
        @Param("userIds") List<UUID> userIds,
        @Param("score") Integer score
    );
}

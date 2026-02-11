package com.aiasistan.repository;

import com.aiasistan.model.WorkEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkEventRepository extends JpaRepository<WorkEvent, UUID> {

    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId AND w.startTime > :now ORDER BY w.startTime ASC")
    List<WorkEvent> findUpcomingEvents(@Param("userId") UUID userId, @Param("now") OffsetDateTime now);

    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId AND w.startTime <= :now AND w.endTime >= :now ORDER BY w.startTime ASC")
    List<WorkEvent> findOngoingEvents(@Param("userId") UUID userId, @Param("now") OffsetDateTime now);

    @Query("SELECT COUNT(w) FROM WorkEvent w WHERE w.userId = :userId AND w.startTime BETWEEN :startDate AND :endDate")
    long countEventsForDay(
        @Param("userId") UUID userId,
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );

    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId AND w.startTime BETWEEN :startDate AND :endDate ORDER BY w.startTime ASC")
    List<WorkEvent> findByUserIdAndDateRange(
        @Param("userId") UUID userId,
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );

    long countByUserId(UUID userId);
}

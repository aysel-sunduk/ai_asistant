/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.HealthLog;

@Repository
public interface HealthLogRepository extends JpaRepository<HealthLog, UUID> {

    Page<HealthLog> findByUserId(UUID userId, Pageable pageable);

    Optional<HealthLog> findByIdAndUserId(UUID id, UUID userId);

    Optional<HealthLog> findByUserIdAndExternalRecordId(UUID userId, String externalRecordId);

    @Query("SELECT h FROM HealthLog h WHERE h.userId = :userId AND h.logDate BETWEEN :startDate AND :endDate ORDER BY h.logDate DESC, h.loggedAt DESC")
    List<HealthLog> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT h FROM HealthLog h WHERE h.userId = :userId AND h.logType = :logType AND h.logDate BETWEEN :startDate AND :endDate ORDER BY h.logDate DESC, h.loggedAt DESC")
    List<HealthLog> findByUserIdAndTypeAndDateRange(
            @Param("userId") UUID userId,
            @Param("logType") String logType,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    Page<HealthLog> findByUserIdAndLogTypeOrderByLoggedAtDesc(UUID userId, String logType, Pageable pageable);
}
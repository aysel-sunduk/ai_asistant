/**
 * Kisa aciklama: Veri erisim sorgularini tanimlar.
 */

package com.aiasistan.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.aiasistan.model.Reminder;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    Page<Reminder> findByUserId(UUID userId, Pageable pageable);

    Optional<Reminder> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT r FROM Reminder r WHERE r.userId = :userId AND r.status = :status ORDER BY r.remindAt ASC")
    List<Reminder> findByUserIdAndStatus(
        @Param("userId") UUID userId,
        @Param("status") String status
    );

    @Query("SELECT r FROM Reminder r WHERE r.userId = :userId AND r.remindAt <= :now AND r.status = :status")
    List<Reminder> findRemindersToNotify(
        @Param("userId") UUID userId,
        @Param("now") OffsetDateTime now,
        @Param("status") String status
    );

    @Query("SELECT r FROM Reminder r WHERE r.userId = :userId AND r.remindAt BETWEEN :startDate AND :endDate ORDER BY r.remindAt ASC")
    List<Reminder> findByUserIdAndDateRange(
        @Param("userId") UUID userId,
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );

    @Query("SELECT r FROM Reminder r WHERE r.userId = :userId AND r.sourceModule = :module AND r.status = :status")
    List<Reminder> findByUserIdAndModule(
        @Param("userId") UUID userId,
        @Param("module") String module,
        @Param("status") String status
    );

    @Query("SELECT r FROM Reminder r WHERE r.workEventId = :workEventId")
    List<Reminder> findByWorkEventId(@Param("workEventId") UUID workEventId);

    @Query("SELECT r FROM Reminder r WHERE r.contactId = :contactId")
    List<Reminder> findByContactId(@Param("contactId") UUID contactId);

    List<Reminder> findByUserIdAndSourceModuleAndTitle(UUID userId, String sourceModule, String title);
    List<Reminder> findByUserIdAndStatusAndRemindAtLessThanEqualOrderByRemindAtAsc(UUID userId, String status, OffsetDateTime remindAt);

    long countByUserId(UUID userId);
}
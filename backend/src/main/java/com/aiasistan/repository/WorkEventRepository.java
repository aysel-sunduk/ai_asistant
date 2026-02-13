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

import com.aiasistan.model.WorkEvent;

@Repository
public interface WorkEventRepository extends JpaRepository<WorkEvent, UUID> {

    // Temel CRUD sorguları
    Page<WorkEvent> findByUserId(UUID userId, Pageable pageable);

    Optional<WorkEvent> findByIdAndUserId(UUID id, UUID userId);
    
    long countByUserId(UUID userId);

    // Tarih aralığına göre sorgular
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime < :endDate AND w.endTime > :startDate " +
           "ORDER BY w.startTime ASC")
    List<WorkEvent> findByUserIdAndDateRange(
        @Param("userId") UUID userId,
        @Param("startDate") OffsetDateTime startDate,
        @Param("endDate") OffsetDateTime endDate
    );

    // Yaklaşan toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime > :now AND w.status = 'SCHEDULED' " +
           "ORDER BY w.startTime ASC")
    List<WorkEvent> findUpcomingEvents(
        @Param("userId") UUID userId, 
        @Param("now") OffsetDateTime now
    );

    @Query("SELECT COUNT(w) FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime > :now AND w.status = 'SCHEDULED'")
    long countUpcomingEvents(
        @Param("userId") UUID userId,
        @Param("now") OffsetDateTime now
    );

    // Devam eden toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime <= :now AND w.endTime >= :now " +
           "AND w.status IN ('SCHEDULED', 'ONGOING') " +
           "ORDER BY w.startTime ASC")
    List<WorkEvent> findOngoingEvents(
        @Param("userId") UUID userId, 
        @Param("now") OffsetDateTime now
    );

    // Bugünkü toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime >= :dayStart AND w.startTime < :dayEnd " +
           "ORDER BY w.startTime ASC")
    List<WorkEvent> findTodayEvents(
        @Param("userId") UUID userId,
        @Param("dayStart") OffsetDateTime dayStart,
        @Param("dayEnd") OffsetDateTime dayEnd
    );

    // Bu haftaki toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime >= :weekStart AND w.startTime < :weekEnd " +
           "ORDER BY w.startTime ASC")
    List<WorkEvent> findThisWeekEvents(
        @Param("userId") UUID userId,
        @Param("weekStart") OffsetDateTime weekStart,
        @Param("weekEnd") OffsetDateTime weekEnd
    );

    @Query("SELECT COUNT(w) FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime >= :weekStart AND w.startTime < :weekEnd")
    long countThisWeekEvents(
        @Param("userId") UUID userId,
        @Param("weekStart") OffsetDateTime weekStart,
        @Param("weekEnd") OffsetDateTime weekEnd
    );

    // Duruma göre toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.status = :status ORDER BY w.startTime DESC")
    Page<WorkEvent> findByUserIdAndStatus(
        @Param("userId") UUID userId,
        @Param("status") String status,
        Pageable pageable
    );

    // Önceliğe göre toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.priority = :priority ORDER BY w.startTime ASC")
    List<WorkEvent> findByUserIdAndPriority(
        @Param("userId") UUID userId,
        @Param("priority") String priority
    );

    // Toplantı tipine göre
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND UPPER(w.eventType) = UPPER(:eventType) ORDER BY w.startTime DESC")
    Page<WorkEvent> findByUserIdAndEventType(
        @Param("userId") UUID userId,
        @Param("eventType") String eventType,
        Pageable pageable
    );

    // Çakışma kontrolü
    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END " +
           "FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "AND w.startTime < :endTime AND w.endTime > :startTime")
    boolean existsOverlappingEvent(
        @Param("userId") UUID userId,
        @Param("startTime") OffsetDateTime startTime,
        @Param("endTime") OffsetDateTime endTime
    );

    // Güncelleme için çakışma kontrolü (mevcut toplantı hariç)
    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END " +
           "FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.id <> :eventId " +
           "AND w.status NOT IN ('CANCELLED', 'COMPLETED') " +
           "AND w.startTime < :endTime AND w.endTime > :startTime")
    boolean existsOverlappingEventExcludingId(
        @Param("userId") UUID userId,
        @Param("eventId") UUID eventId,
        @Param("startTime") OffsetDateTime startTime,
        @Param("endTime") OffsetDateTime endTime
    );

    // Belirli bir gün için toplantı sayısı
    @Query("SELECT COUNT(w) FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.startTime >= :dayStart AND w.startTime < :dayEnd")
    long countEventsForDay(
        @Param("userId") UUID userId,
        @Param("dayStart") OffsetDateTime dayStart,
        @Param("dayEnd") OffsetDateTime dayEnd
    );

    // Hatırlatma gönderilmemiş toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.reminderSent = false " +
           "AND w.status = 'SCHEDULED' " +
           "AND w.startTime > :now " +
           "AND w.startTime <= :reminderThreshold")
    List<WorkEvent> findEventsNeedingReminder(
        @Param("userId") UUID userId,
        @Param("now") OffsetDateTime now,
        @Param("reminderThreshold") OffsetDateTime reminderThreshold
    );

    // İstatistikler için - Duruma göre sayım
    @Query("SELECT COUNT(w) FROM WorkEvent w WHERE w.userId = :userId AND w.status = :status")
    long countByUserIdAndStatus(
        @Param("userId") UUID userId,
        @Param("status") String status
    );

    // İstatistikler için - Toplam katılımcı sayısı
    @Query("SELECT COALESCE(SUM(w.participantCount), 0) FROM WorkEvent w WHERE w.userId = :userId")
    long sumParticipantsByUserId(@Param("userId") UUID userId);

    // İstatistikler için - Ortalama toplantı süresi (dakika)
    @Query(
        value = "SELECT AVG(EXTRACT(EPOCH FROM (w.end_time - w.start_time)) / 60.0) " +
                "FROM work_events w WHERE w.user_id = :userId",
        nativeQuery = true
    )
    Double averageDurationMinutesByUserId(@Param("userId") UUID userId);

    // Online toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.isOnline = true ORDER BY w.startTime DESC")
    Page<WorkEvent> findOnlineEvents(
        @Param("userId") UUID userId,
        Pageable pageable
    );

    // Arama - başlık veya açıklamaya göre
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND (LOWER(w.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(w.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY w.startTime DESC")
    Page<WorkEvent> searchEvents(
        @Param("userId") UUID userId,
        @Param("searchTerm") String searchTerm,
        Pageable pageable
    );

    // Belirli konumdaki toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND LOWER(w.location) LIKE LOWER(CONCAT('%', :location, '%')) " +
           "ORDER BY w.startTime DESC")
    List<WorkEvent> findByUserIdAndLocationContaining(
        @Param("userId") UUID userId,
        @Param("location") String location
    );

    // Geçmiş toplantılar
    @Query("SELECT w FROM WorkEvent w WHERE w.userId = :userId " +
           "AND w.endTime < :now " +
           "ORDER BY w.startTime DESC")
    Page<WorkEvent> findPastEvents(
        @Param("userId") UUID userId,
        @Param("now") OffsetDateTime now,
        Pageable pageable
    );
}

/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.WorkEventDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.WorkEvent;
import com.aiasistan.repository.WorkEventRepository;

@Service
public class WorkEventService {
    private static final Logger logger = LoggerFactory.getLogger(WorkEventService.class);

    private final WorkEventRepository workEventRepository;
    private final UserService userService;
    private final GoogleCalendarService googleCalendarService;

    public WorkEventService(
        WorkEventRepository workEventRepository,
        UserService userService,
        GoogleCalendarService googleCalendarService
    ) {
        this.workEventRepository = workEventRepository;
        this.userService = userService;
        this.googleCalendarService = googleCalendarService;
    }

    @Transactional
    public WorkEventDto.Response createWorkEvent(String userEmail, WorkEventDto.Request request) {
        validateEventRequest(request);
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateNoOverlap(userId, request.getStartTime(), request.getEndTime(), null);

        WorkEvent event = new WorkEvent();
        event.setUserId(userId);
        applyRequest(event, request);

        WorkEvent saved = workEventRepository.save(event);
        syncWorkEventToGoogle(saved);
        return WorkEventDto.Response.from(saved);
    }

    @Transactional(readOnly = true)
    public WorkEventDto.Response getWorkEventById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        WorkEvent event = findOwnedEvent(id, userId);
        return WorkEventDto.Response.from(event);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkEventDto.Response> getAllWorkEvents(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<WorkEventDto.Response> page = workEventRepository
            .findByUserId(userId, pageable)
            .map(WorkEventDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<WorkEventDto.Response> getEventsByDateRange(
        String userEmail, 
        OffsetDateTime startDate, 
        OffsetDateTime endDate
    ) {
        validateDateRange(startDate, endDate);
        UUID userId = userService.getUserIdByEmail(userEmail);
        return workEventRepository.findByUserIdAndDateRange(userId, startDate, endDate)
            .stream()
            .map(WorkEventDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkEventDto.Response> getUpcomingEvents(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = OffsetDateTime.now();
        return workEventRepository.findUpcomingEvents(userId, now)
            .stream()
            .map(WorkEventDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkEventDto.Response> getOngoingEvents(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = OffsetDateTime.now();
        return workEventRepository.findOngoingEvents(userId, now)
            .stream()
            .map(WorkEventDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkEventDto.Response> getTodayEvents(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = now.truncatedTo(ChronoUnit.DAYS);
        OffsetDateTime dayEnd = dayStart.plusDays(1);
        
        return workEventRepository.findTodayEvents(userId, dayStart, dayEnd)
            .stream()
            .map(WorkEventDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkEventDto.Response> getThisWeekEvents(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime weekStart = now.truncatedTo(ChronoUnit.DAYS)
            .with(java.time.DayOfWeek.MONDAY);
        OffsetDateTime weekEnd = weekStart.plusWeeks(1);
        
        return workEventRepository.findThisWeekEvents(userId, weekStart, weekEnd)
            .stream()
            .map(WorkEventDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkEventDto.Response> getEventsByStatus(
        String userEmail, 
        String status,
        Pageable pageable
    ) {
        String normalizedStatus = normalizeEnumValue(status);
        validateStatus(normalizedStatus);
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<WorkEventDto.Response> page = workEventRepository
            .findByUserIdAndStatus(userId, normalizedStatus, pageable)
            .map(WorkEventDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<WorkEventDto.Response> getEventsByPriority(
        String userEmail, 
        String priority
    ) {
        String normalizedPriority = normalizeEnumValue(priority);
        validatePriority(normalizedPriority);
        UUID userId = userService.getUserIdByEmail(userEmail);
        return workEventRepository.findByUserIdAndPriority(userId, normalizedPriority)
            .stream()
            .map(WorkEventDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkEventDto.Response> getEventsByType(
        String userEmail, 
        String eventType,
        Pageable pageable
    ) {
        String normalizedEventType = normalizeEnumValue(eventType);
        validateEventType(normalizedEventType);
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<WorkEventDto.Response> page = workEventRepository
            .findByUserIdAndEventType(userId, normalizedEventType, pageable)
            .map(WorkEventDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkEventDto.Response> getOnlineEvents(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<WorkEventDto.Response> page = workEventRepository
            .findOnlineEvents(userId, pageable)
            .map(WorkEventDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkEventDto.Response> searchEvents(
        String userEmail, 
        String searchTerm, 
        Pageable pageable
    ) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<WorkEventDto.Response> page = workEventRepository
            .searchEvents(userId, searchTerm, pageable)
            .map(WorkEventDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkEventDto.Response> getPastEvents(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = OffsetDateTime.now();
        Page<WorkEventDto.Response> page = workEventRepository
            .findPastEvents(userId, now, pageable)
            .map(WorkEventDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public WorkEventDto.Summary getEventsSummary(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = now.truncatedTo(ChronoUnit.DAYS);
        OffsetDateTime dayEnd = dayStart.plusDays(1);
        OffsetDateTime weekStart = dayStart.with(java.time.DayOfWeek.MONDAY);
        OffsetDateTime weekEnd = weekStart.plusWeeks(1);

        WorkEventDto.Summary summary = new WorkEventDto.Summary();
        summary.setTotalEvents(workEventRepository.countByUserId(userId));
        summary.setScheduledEvents(workEventRepository.countByUserIdAndStatus(userId, "SCHEDULED"));
        summary.setCompletedEvents(workEventRepository.countByUserIdAndStatus(userId, "COMPLETED"));
        summary.setCancelledEvents(workEventRepository.countByUserIdAndStatus(userId, "CANCELLED"));
        summary.setUpcomingEvents(workEventRepository.countUpcomingEvents(userId, now));
        summary.setTodayEvents(workEventRepository.countEventsForDay(userId, dayStart, dayEnd));
        summary.setThisWeekEvents(workEventRepository.countThisWeekEvents(userId, weekStart, weekEnd));
        summary.setAverageDurationMinutes(workEventRepository.averageDurationMinutesByUserId(userId));
        
        // long to int conversion
        long totalParticipants = workEventRepository.sumParticipantsByUserId(userId);
        summary.setTotalParticipants((int) totalParticipants);

        return summary;
    }

    @Transactional
    public WorkEventDto.Response updateWorkEvent(String userEmail, UUID id, WorkEventDto.Request request) {
        validateEventRequest(request);
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateNoOverlap(userId, request.getStartTime(), request.getEndTime(), id);
        
        WorkEvent event = findOwnedEvent(id, userId);
        applyRequest(event, request);

        WorkEvent saved = workEventRepository.save(event);
        syncWorkEventToGoogle(saved);
        return WorkEventDto.Response.from(saved);
    }

    @Transactional
    public WorkEventDto.Response updateEventStatus(
        String userEmail, 
        UUID id, 
        String newStatus
    ) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        WorkEvent event = findOwnedEvent(id, userId);
        
        String normalizedStatus = normalizeEnumValue(newStatus);
        validateStatus(normalizedStatus);
        event.setStatus(normalizedStatus);
        
        // Tamamlanan toplantılar için otomatik kontroller
        if ("COMPLETED".equals(normalizedStatus) && event.getEndTime().isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("Henuz bitmemis bir toplanti tamamlandi olarak isaretlenemez");
        }

        WorkEvent saved = workEventRepository.save(event);
        syncWorkEventToGoogle(saved);
        return WorkEventDto.Response.from(saved);
    }

    @Transactional
    public void deleteWorkEvent(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        WorkEvent event = findOwnedEvent(id, userId);
        deleteWorkEventFromGoogle(event);
        event.setDeletedAt(OffsetDateTime.now());
        workEventRepository.save(event);
    }

    private void syncWorkEventToGoogle(WorkEvent event) {
        try {
            String eventId = googleCalendarService.syncWorkEvent(event);
            if (eventId != null && !eventId.equals(event.getGoogleCalendarEventId())) {
                event.setGoogleCalendarEventId(eventId);
                workEventRepository.save(event);
            }
        } catch (Exception ex) {
            logger.warn("WorkEvent Google Calendar sync basarisiz. eventId={}, msg={}", event.getId(), ex.getMessage());
        }
    }

    private void deleteWorkEventFromGoogle(WorkEvent event) {
        try {
            googleCalendarService.deleteWorkEvent(event);
            if (event.getGoogleCalendarEventId() != null) {
                event.setGoogleCalendarEventId(null);
                workEventRepository.save(event);
            }
        } catch (Exception ex) {
            logger.warn("WorkEvent Google Calendar silme basarisiz. eventId={}, msg={}", event.getId(), ex.getMessage());
        }
    }

    @Transactional
    public void markReminderSent(UUID eventId) {
        if (eventId == null) {
            throw new BadRequestException("Event ID zorunludur");
        }
        WorkEvent event = workEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("Toplanti bulunamadi"));
        event.setReminderSent(true);
        workEventRepository.save(event);
    }

    private WorkEvent findOwnedEvent(UUID id, UUID userId) {
        if (id == null || userId == null) {
            throw new BadRequestException("ID ve kullanici ID'si zorunludur");
        }
        return workEventRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Toplanti bulunamadi veya size ait degil"));
    }

    private void applyRequest(WorkEvent event, WorkEventDto.Request request) {
        event.setTitle(request.getTitle().trim());
        event.setDescription(request.getDescription());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setParticipantCount(request.getParticipantCount() != null ? request.getParticipantCount() : 0);
        event.setLocation(request.getLocation() != null ? request.getLocation().trim() : null);
        
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            String normalizedStatus = normalizeEnumValue(request.getStatus());
            validateStatus(normalizedStatus);
            event.setStatus(normalizedStatus);
        } else if (!isTerminalStatus(event.getStatus())) {
            event.setStatus(inferStatus(request.getStartTime(), request.getEndTime()));
        }
        if (request.getPriority() != null && !request.getPriority().trim().isEmpty()) {
            String normalizedPriority = normalizeEnumValue(request.getPriority());
            validatePriority(normalizedPriority);
            event.setPriority(normalizedPriority);
        }
        if (request.getEventType() != null && !request.getEventType().trim().isEmpty()) {
            String normalizedEventType = normalizeEnumValue(request.getEventType());
            validateEventType(normalizedEventType);
            event.setEventType(normalizedEventType);
        }
        if (request.getIsOnline() != null) {
            event.setIsOnline(request.getIsOnline());
            if (!request.getIsOnline()) {
                event.setMeetingUrl(null);
            } else {
                event.setLocation(null);
            }
        }
        if (request.getMeetingUrl() != null && Boolean.TRUE.equals(event.getIsOnline())) {
            event.setMeetingUrl(request.getMeetingUrl().trim());
        }
        if (request.getReminderMinutesBefore() != null) {
            event.setReminderMinutesBefore(request.getReminderMinutesBefore());
        }
        
        event.setMetadata(request.getMetadata());
        event.setNotes(request.getNotes());
    }

    private void validateEventRequest(WorkEventDto.Request request) {
        validateDateRange(request.getStartTime(), request.getEndTime());
        validateParticipantCount(request.getParticipantCount());
        validateEventDuration(request.getStartTime(), request.getEndTime());
        validateOnlineMeetingUrl(request.getIsOnline(), request.getMeetingUrl());
        validateLocationForOffline(request.getIsOnline(), request.getLocation());
        
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            validateStatus(normalizeEnumValue(request.getStatus()));
        }
        if (request.getPriority() != null && !request.getPriority().trim().isEmpty()) {
            validatePriority(normalizeEnumValue(request.getPriority()));
        }
        if (request.getEventType() != null && !request.getEventType().trim().isEmpty()) {
            validateEventType(normalizeEnumValue(request.getEventType()));
        }
    }

    private void validateDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Baslangic ve bitis zamani zorunludur");
        }
        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("Bitis zamani baslangic zamanindan sonra olmalidir");
        }
    }

    private void validateEventDuration(OffsetDateTime startTime, OffsetDateTime endTime) {
        long minutes = ChronoUnit.MINUTES.between(startTime, endTime);
        
        if (minutes < 1) {
            throw new BadRequestException("Toplanti suresi en az 1 dakika olmalidir");
        }
        
        if (minutes > 1440) { // 24 saat
            throw new BadRequestException("Toplanti suresi 24 saatten fazla olamaz");
        }
    }

    private void validateParticipantCount(Integer participantCount) {
        if (participantCount != null && participantCount < 0) {
            throw new BadRequestException("Katilimci sayisi negatif olamaz");
        }
        if (participantCount != null && participantCount > 10000) {
            throw new BadRequestException("Katilimci sayisi 10000'den fazla olamaz");
        }
    }

    private void validateOnlineMeetingUrl(Boolean isOnline, String meetingUrl) {
        if (isOnline != null && isOnline && (meetingUrl == null || meetingUrl.trim().isEmpty())) {
            throw new BadRequestException("Online toplanti icin meeting URL zorunludur");
        }
        if (Boolean.FALSE.equals(isOnline) && meetingUrl != null && !meetingUrl.trim().isEmpty()) {
            throw new BadRequestException("Fiziksel toplanti icin meeting URL gonderilemez");
        }
    }

    private void validateLocationForOffline(Boolean isOnline, String location) {
        if (Boolean.FALSE.equals(isOnline) && (location == null || location.trim().isEmpty())) {
            throw new BadRequestException("Fiziksel toplanti icin konum zorunludur");
        }
        if (Boolean.TRUE.equals(isOnline) && location != null && !location.trim().isEmpty()) {
            throw new BadRequestException("Online toplanti icin fiziksel konum gonderilemez");
        }
    }

    private boolean isTerminalStatus(String status) {
        return "COMPLETED".equals(status) || "CANCELLED".equals(status) || "POSTPONED".equals(status);
    }

    private String inferStatus(OffsetDateTime startTime, OffsetDateTime endTime) {
        OffsetDateTime now = OffsetDateTime.now();
        if (endTime.isBefore(now)) return "COMPLETED";
        if (!startTime.isAfter(now) && !endTime.isBefore(now)) return "ONGOING";
        return "SCHEDULED";
    }

    private void validateStatus(String status) {
        if (status == null) return;
        String[] validStatuses = {"SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED", "POSTPONED"};
        for (String valid : validStatuses) {
            if (valid.equals(status)) return;
        }
        throw new BadRequestException("Gecersiz durum: " + status);
    }

    private void validatePriority(String priority) {
        if (priority == null) return;
        String[] validPriorities = {"LOW", "MEDIUM", "HIGH", "URGENT"};
        for (String valid : validPriorities) {
            if (valid.equals(priority)) return;
        }
        throw new BadRequestException("Gecersiz oncelik: " + priority);
    }

    private void validateEventType(String eventType) {
        if (eventType == null) return;
        String[] validTypes = {"MEETING", "CONFERENCE", "PRESENTATION", "INTERVIEW", 
                               "TRAINING", "WORKSHOP", "CLIENT_MEETING", "TEAM_MEETING", 
                               "ONE_ON_ONE", "BRAINSTORMING", "REVIEW", "OTHER"};
        for (String valid : validTypes) {
            if (valid.equals(eventType)) return;
        }
        throw new BadRequestException("Gecersiz toplanti tipi: " + eventType);
    }

    private void validateNoOverlap(UUID userId, OffsetDateTime startTime, OffsetDateTime endTime, UUID eventId) {
        boolean overlaps = eventId == null
            ? workEventRepository.existsOverlappingEvent(userId, startTime, endTime)
            : workEventRepository.existsOverlappingEventExcludingId(userId, eventId, startTime, endTime);

        if (overlaps) {
            throw new BadRequestException("Bu zaman araliginda baska bir toplanti zaten mevcut");
        }
    }

    private String normalizeEnumValue(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }
}

package com.aiasistan.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.ReminderDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Reminder;
import com.aiasistan.repository.ReminderRepository;
import com.aiasistan.repository.WorkEventRepository;

@Service
public class ReminderService {

    private static final Set<String> ALLOWED_MODULES = Set.of(
        "general", "business", "work", "family", "health", "finance", "social", "shopping", "goals"
    );
    private static final Set<String> ALLOWED_CHANNELS = Set.of("in_app", "email", "push", "sms");
    private static final Set<String> ALLOWED_RECURRENCES = Set.of(
        "none", "daily", "weekly", "monthly", "yearly", "weekdays", "custom"
    );
    private static final Set<String> ALLOWED_STATUSES = Set.of("scheduled", "sent", "skipped", "canceled");

    private final ReminderRepository reminderRepository;
    private final WorkEventRepository workEventRepository;
    private final UserService userService;

    public ReminderService(
        ReminderRepository reminderRepository,
        WorkEventRepository workEventRepository,
        UserService userService
    ) {
        this.reminderRepository = reminderRepository;
        this.workEventRepository = workEventRepository;
        this.userService = userService;
    }

    @Transactional
    public ReminderDto.Response createReminder(String userEmail, ReminderDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        validateRemindAt(request.getRemindAt());
        validateWorkEvent(userId, request.getWorkEventId());

        Reminder reminder = new Reminder();
        reminder.setUserId(userId);
        reminder.setTitle(request.getTitle());
        reminder.setRemindAt(request.getRemindAt());
        reminder.setWorkEventId(request.getWorkEventId());
        reminder.setContactId(request.getContactId());
        reminder.setSourceModule(normalizeModule(request.getSourceModule()));
        reminder.setRecurrence(normalizeRecurrence(request.getRecurrence()));
        reminder.setChannel(normalizeChannel(request.getChannel()));
        reminder.setStatus("scheduled");

        reminder = saveWithConstraintHandling(reminder);
        return ReminderDto.Response.from(reminder);
    }

    @Transactional(readOnly = true)
    public ReminderDto.Response getReminderById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Reminder reminder = reminderRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Hatirlatici bulunamadi"));
        return ReminderDto.Response.from(reminder);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReminderDto.Response> getAllReminders(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<Reminder> reminders = reminderRepository.findByUserId(userId, pageable);
        return PageResponse.of(reminders.map(ReminderDto.Response::from));
    }

    @Transactional(readOnly = true)
    public List<ReminderDto.Response> getScheduledReminders(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        return reminderRepository.findByUserIdAndStatus(userId, "scheduled")
            .stream()
            .map(ReminderDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReminderDto.Response> getNotificationFeed(String userEmail, int withinMinutes) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        int safeWindow = Math.max(1, Math.min(withinMinutes, 60 * 24 * 30));
        OffsetDateTime threshold = OffsetDateTime.now().plusMinutes(safeWindow);
        return reminderRepository
            .findByUserIdAndStatusAndRemindAtLessThanEqualOrderByRemindAtAsc(userId, "scheduled", threshold)
            .stream()
            .map(ReminderDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReminderDto.Response> getRemindersByDateRange(String userEmail, OffsetDateTime startDate, OffsetDateTime endDate) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        return reminderRepository.findByUserIdAndDateRange(userId, startDate, endDate)
            .stream()
            .map(ReminderDto.Response::from)
            .collect(Collectors.toList());
    }

    @Transactional
    public ReminderDto.Response updateReminder(String userEmail, UUID id, ReminderDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Reminder reminder = reminderRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Hatirlatici bulunamadi"));

        validateRemindAt(request.getRemindAt());
        validateWorkEvent(userId, request.getWorkEventId());
        reminder.setTitle(request.getTitle());
        reminder.setRemindAt(request.getRemindAt());
        reminder.setWorkEventId(request.getWorkEventId());
        reminder.setContactId(request.getContactId());
        reminder.setSourceModule(normalizeModule(request.getSourceModule()));
        reminder.setRecurrence(normalizeRecurrence(request.getRecurrence()));
        reminder.setChannel(normalizeChannel(request.getChannel()));

        reminder = saveWithConstraintHandling(reminder);
        return ReminderDto.Response.from(reminder);
    }

    @Transactional
    public ReminderDto.Response updateReminderStatus(String userEmail, UUID id, String status) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Reminder reminder = reminderRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Hatirlatici bulunamadi"));

        reminder.setStatus(normalizeStatus(status));
        reminder = reminderRepository.save(reminder);
        return ReminderDto.Response.from(reminder);
    }

    @Transactional
    public ReminderDto.Response dismissNotification(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Reminder reminder = reminderRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Bildirim bulunamadi"));
        reminder.setStatus("skipped");
        return ReminderDto.Response.from(reminderRepository.save(reminder));
    }

    @Transactional
    public int clearNotifications(String userEmail, int withinMinutes) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        int safeWindow = Math.max(1, Math.min(withinMinutes, 60 * 24 * 30));
        OffsetDateTime threshold = OffsetDateTime.now().plusMinutes(safeWindow);
        List<Reminder> notifications = reminderRepository
            .findByUserIdAndStatusAndRemindAtLessThanEqualOrderByRemindAtAsc(userId, "scheduled", threshold);

        if (notifications.isEmpty()) {
            return 0;
        }
        notifications.forEach(r -> r.setStatus("skipped"));
        reminderRepository.saveAll(notifications);
        return notifications.size();
    }

    @Transactional
    public void deleteReminder(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Reminder reminder = reminderRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Hatirlatici bulunamadi"));
        reminderRepository.delete(reminder);
    }

    private String normalizeModule(String module) {
        if (module == null || module.isBlank()) {
            return "general";
        }
        String normalized = normalizeToken(module);
        if (!ALLOWED_MODULES.contains(normalized)) {
            throw new BadRequestException("Gecersiz sourceModule. Kabul edilen degerler: " + String.join(", ", ALLOWED_MODULES));
        }
        return normalized;
    }

    private String normalizeChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return "in_app";
        }
        String normalized = normalizeToken(channel);
        if (!ALLOWED_CHANNELS.contains(normalized)) {
            throw new BadRequestException("Gecersiz channel. Kabul edilen degerler: " + String.join(", ", ALLOWED_CHANNELS));
        }
        return normalized;
    }

    private String normalizeRecurrence(String recurrence) {
        if (recurrence == null || recurrence.isBlank()) {
            return "none";
        }
        String normalized = normalizeToken(recurrence);
        if (!ALLOWED_RECURRENCES.contains(normalized)) {
            throw new BadRequestException("Gecersiz recurrence. Kabul edilen degerler: " + String.join(", ", ALLOWED_RECURRENCES));
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "scheduled";
        }
        String normalized = normalizeToken(status);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new BadRequestException("Gecersiz status. Kabul edilen degerler: " + String.join(", ", ALLOWED_STATUSES));
        }
        return normalized;
    }

    private void validateRemindAt(OffsetDateTime remindAt) {
        if (remindAt == null) {
            throw new BadRequestException("remindAt zorunludur");
        }
    }

    private String normalizeToken(String value) {
        return value.trim().toLowerCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
    }

    private void validateWorkEvent(UUID userId, UUID workEventId) {
        if (workEventId == null) {
            return;
        }
        boolean existsForUser = workEventRepository.findByIdAndUserId(workEventId, userId).isPresent();
        if (!existsForUser) {
            throw new BadRequestException("Gecersiz workEventId: Bu kullaniciya ait bir etkinlik bulunamadi");
        }
    }

    private Reminder saveWithConstraintHandling(Reminder reminder) {
        try {
            return reminderRepository.save(reminder);
        } catch (DataIntegrityViolationException ex) {
            String message = ex.getMostSpecificCause() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

            if (message != null) {
                if (message.contains("fk_reminders_work_event")) {
                    throw new BadRequestException("Gecersiz workEventId: work_events tablosunda kayit bulunamadi");
                }
                if (message.contains("fk_reminders_contact")) {
                    throw new BadRequestException("Gecersiz contactId: contacts tablosunda kayit bulunamadi");
                }
            }
            throw ex;
        }
    }
}

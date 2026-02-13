package com.aiasistan.service;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.ReminderDto;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.Reminder;
import com.aiasistan.repository.ReminderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserService userService;

    public ReminderService(ReminderRepository reminderRepository, UserService userService) {
        this.reminderRepository = reminderRepository;
        this.userService = userService;
    }

    @Transactional
    public ReminderDto.Response createReminder(String userEmail, ReminderDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        Reminder reminder = new Reminder();
        reminder.setUserId(userId);
        reminder.setTitle(request.getTitle());
        reminder.setRemindAt(request.getRemindAt());
        reminder.setWorkEventId(request.getWorkEventId());
        reminder.setContactId(request.getContactId());
        reminder.setSourceModule(normalizeModule(request.getSourceModule()));
        reminder.setRecurrence(request.getRecurrence());
        reminder.setChannel(normalizeChannel(request.getChannel()));
        reminder.setStatus("scheduled");

        reminder = reminderRepository.save(reminder);
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
        Page<ReminderDto.Response> responsePage = reminders.map(ReminderDto.Response::from);
        return PageResponse.of(responsePage);
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

        reminder.setTitle(request.getTitle());
        reminder.setRemindAt(request.getRemindAt());
        reminder.setWorkEventId(request.getWorkEventId());
        reminder.setContactId(request.getContactId());
        reminder.setSourceModule(normalizeModule(request.getSourceModule()));
        reminder.setRecurrence(request.getRecurrence());
        if (request.getChannel() != null) {
            reminder.setChannel(normalizeChannel(request.getChannel()));
        }

        reminder = reminderRepository.save(reminder);
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
    public void deleteReminder(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Reminder reminder = reminderRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Hatirlatici bulunamadi"));
        reminderRepository.delete(reminder);
    }

    private String normalizeModule(String module) {
        if (module == null || module.isBlank()) {
            return null;
        }
        return module.trim().toLowerCase();
    }

    private String normalizeChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return "in_app";
        }
        return channel.trim().toLowerCase();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "scheduled";
        }
        return status.trim().toLowerCase();
    }
}

package com.aiasistan.service;

import com.aiasistan.common.DateTimeUtils;
import com.aiasistan.common.enums.ReminderStatus;
import com.aiasistan.dto.BusinessDashboardDto;
import com.aiasistan.dto.ReminderDto;
import com.aiasistan.dto.WorkEventDto;
import com.aiasistan.model.Reminder;
import com.aiasistan.model.WorkEvent;
import com.aiasistan.repository.ReminderRepository;
import com.aiasistan.repository.WorkEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
public class BusinessDashboardService {

    private final WorkEventRepository workEventRepository;
    private final ReminderRepository reminderRepository;
    private final UserService userService;

    public BusinessDashboardService(
        WorkEventRepository workEventRepository,
        ReminderRepository reminderRepository,
        UserService userService
    ) {
        this.workEventRepository = workEventRepository;
        this.reminderRepository = reminderRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public BusinessDashboardDto.Statistics getStatistics(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = DateTimeUtils.now();
        OffsetDateTime todayStart = DateTimeUtils.startOfDay(LocalDate.now(ZoneOffset.UTC));
        OffsetDateTime todayEnd = DateTimeUtils.endOfDay(LocalDate.now(ZoneOffset.UTC));

        LocalDate weekStart = LocalDate.now(ZoneOffset.UTC).with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        long totalEvents = workEventRepository.countByUserId(userId);
        List<WorkEvent> upcomingEvents = workEventRepository.findUpcomingEvents(userId, now);
        List<WorkEvent> ongoingEvents = workEventRepository.findOngoingEvents(userId, now);
        long todayEvents = workEventRepository.countEventsForDay(userId, todayStart, todayEnd);

        List<WorkEvent> thisWeekEvents = workEventRepository.findByUserIdAndDateRange(
            userId,
            weekStart.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime(),
            weekEnd.atTime(23, 59, 59).atOffset(ZoneOffset.UTC)
        );

        long totalReminders = reminderRepository.countByUserId(userId);
        List<Reminder> scheduledReminders = reminderRepository.findByUserIdAndStatus(userId, ReminderStatus.SCHEDULED);
        List<Reminder> overdueReminders = reminderRepository.findRemindersToNotify(userId, now, ReminderStatus.SCHEDULED);

        BusinessDashboardDto.Statistics stats = new BusinessDashboardDto.Statistics();
        stats.setTotalEvents(totalEvents);
        stats.setUpcomingEvents((long) upcomingEvents.size());
        stats.setOngoingEvents((long) ongoingEvents.size());
        stats.setTodayEvents(todayEvents);
        stats.setThisWeekEvents((long) thisWeekEvents.size());
        stats.setTotalReminders(totalReminders);
        stats.setScheduledReminders((long) scheduledReminders.size());
        stats.setOverdueReminders((long) overdueReminders.size());
        return stats;
    }

    @Transactional(readOnly = true)
    public BusinessDashboardDto.TodaySummary getTodaySummary(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        OffsetDateTime now = DateTimeUtils.now();
        OffsetDateTime todayStart = DateTimeUtils.startOfDay(LocalDate.now(ZoneOffset.UTC));
        OffsetDateTime todayEnd = DateTimeUtils.endOfDay(LocalDate.now(ZoneOffset.UTC));

        List<WorkEvent> todayEvents = workEventRepository.findByUserIdAndDateRange(userId, todayStart, todayEnd);
        List<WorkEvent> upcomingEvents = workEventRepository.findUpcomingEvents(userId, now);
        List<Reminder> dueReminders = reminderRepository.findRemindersToNotify(userId, todayEnd, ReminderStatus.SCHEDULED);

        WorkEventDto.Response nextEvent = upcomingEvents.isEmpty() ? null : WorkEventDto.Response.from(upcomingEvents.get(0));
        List<Reminder> scheduledReminders = reminderRepository.findByUserIdAndStatus(userId, ReminderStatus.SCHEDULED);
        ReminderDto.Response nextReminder = scheduledReminders.isEmpty() ? null : ReminderDto.Response.from(scheduledReminders.get(0));

        BusinessDashboardDto.TodaySummary summary = new BusinessDashboardDto.TodaySummary();
        summary.setTotalEvents((long) todayEvents.size());
        summary.setCompletedEvents(0L);
        summary.setUpcomingEvents((long) upcomingEvents.size());
        summary.setDueReminders((long) dueReminders.size());
        summary.setNextEvent(nextEvent);
        summary.setNextReminder(nextReminder);
        return summary;
    }

    @Transactional(readOnly = true)
    public BusinessDashboardDto.WeeklyOverview getWeeklyOverview(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        LocalDate weekStart = LocalDate.now(ZoneOffset.UTC).with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        OffsetDateTime weekStartTime = weekStart.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
        OffsetDateTime weekEndTime = weekEnd.atTime(23, 59, 59).atOffset(ZoneOffset.UTC);

        List<WorkEvent> weekEvents = workEventRepository.findByUserIdAndDateRange(userId, weekStartTime, weekEndTime);
        List<Reminder> weekReminders = reminderRepository.findByUserIdAndDateRange(userId, weekStartTime, weekEndTime);

        int busyDays = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate day = weekStart.plusDays(i);
            OffsetDateTime dayStart = day.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
            OffsetDateTime dayEnd = day.atTime(23, 59, 59).atOffset(ZoneOffset.UTC);

            long dayEventCount = weekEvents.stream()
                .filter(e -> !e.getStartTime().isBefore(dayStart) && !e.getStartTime().isAfter(dayEnd))
                .count();

            if (dayEventCount > 0) {
                busyDays++;
            }
        }

        BusinessDashboardDto.WeeklyOverview overview = new BusinessDashboardDto.WeeklyOverview();
        overview.setWeekStart(weekStartTime);
        overview.setWeekEnd(weekEndTime);
        overview.setTotalEvents((long) weekEvents.size());
        overview.setTotalReminders((long) weekReminders.size());
        overview.setBusyDays(busyDays);
        overview.setFreeDays(7 - busyDays);
        return overview;
    }
}

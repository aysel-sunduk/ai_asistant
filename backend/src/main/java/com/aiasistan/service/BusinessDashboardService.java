/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.DateTimeUtils;
import com.aiasistan.dto.BusinessDashboardDto;
import com.aiasistan.dto.ReminderDto;
import com.aiasistan.dto.WorkEventDto;
import com.aiasistan.model.Reminder;
import com.aiasistan.model.UserProfile;
import com.aiasistan.model.WorkEvent;
import com.aiasistan.repository.ReminderRepository;
import com.aiasistan.repository.UserProfileRepository;
import com.aiasistan.repository.WorkEventRepository;

@Service
public class BusinessDashboardService {

    private final WorkEventRepository workEventRepository;
    private final ReminderRepository reminderRepository;
    private final UserService userService;
    private final UserProfileRepository userProfileRepository;

    public BusinessDashboardService(
        WorkEventRepository workEventRepository,
        ReminderRepository reminderRepository,
        UserService userService,
        UserProfileRepository userProfileRepository
    ) {
        this.workEventRepository = workEventRepository;
        this.reminderRepository = reminderRepository;
        this.userService = userService;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public BusinessDashboardDto.Statistics getStatistics(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ZoneId zoneId = resolveUserZone(userId);
        OffsetDateTime now = DateTimeUtils.now();
        LocalDate userToday = ZonedDateTime.now(zoneId).toLocalDate();
        OffsetDateTime todayStart = userToday.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime todayEnd = userToday.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        LocalDate weekStart = userToday.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        long totalEvents = workEventRepository.countByUserId(userId);
        List<WorkEvent> upcomingEvents = workEventRepository.findUpcomingEvents(userId, now);
        List<WorkEvent> ongoingEvents = workEventRepository.findOngoingEvents(userId, now);
        long todayEvents = workEventRepository.countEventsForDay(userId, todayStart, todayEnd);

        List<WorkEvent> thisWeekEvents = workEventRepository.findByUserIdAndDateRange(
            userId,
            weekStart.atStartOfDay(zoneId).toOffsetDateTime(),
            weekEnd.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime()
        );

        long totalReminders = reminderRepository.countByUserId(userId);
        List<Reminder> scheduledReminders = reminderRepository.findByUserIdAndStatus(userId, "scheduled");
        List<Reminder> overdueReminders = reminderRepository.findRemindersToNotify(userId, now, "scheduled");

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
        ZoneId zoneId = resolveUserZone(userId);
        OffsetDateTime now = DateTimeUtils.now();
        LocalDate userToday = ZonedDateTime.now(zoneId).toLocalDate();
        OffsetDateTime todayStart = userToday.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime todayEnd = userToday.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        List<WorkEvent> todayEvents = workEventRepository.findByUserIdAndDateRange(userId, todayStart, todayEnd);
        List<WorkEvent> upcomingEvents = workEventRepository.findUpcomingEvents(userId, now);
        List<Reminder> dueReminders = reminderRepository.findRemindersToNotify(userId, todayEnd, "scheduled");

        WorkEventDto.Response nextEvent = upcomingEvents.isEmpty() ? null : WorkEventDto.Response.from(upcomingEvents.get(0));
        List<Reminder> scheduledReminders = reminderRepository.findByUserIdAndStatus(userId, "scheduled");
        ReminderDto.Response nextReminder = scheduledReminders.isEmpty() ? null : ReminderDto.Response.from(scheduledReminders.get(0));

        BusinessDashboardDto.TodaySummary summary = new BusinessDashboardDto.TodaySummary();
        summary.setTotalEvents((long) todayEvents.size());
        summary.setCompletedEvents(todayEvents.stream().filter(e -> !e.getEndTime().isAfter(now)).count());
        summary.setUpcomingEvents((long) upcomingEvents.size());
        summary.setDueReminders((long) dueReminders.size());
        summary.setNextEvent(nextEvent);
        summary.setNextReminder(nextReminder);
        return summary;
    }

    @Transactional(readOnly = true)
    public BusinessDashboardDto.WeeklyOverview getWeeklyOverview(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ZoneId zoneId = resolveUserZone(userId);

        LocalDate weekStart = ZonedDateTime.now(zoneId).toLocalDate().with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        OffsetDateTime weekStartTime = weekStart.atStartOfDay(zoneId).toOffsetDateTime();
        OffsetDateTime weekEndTime = weekEnd.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

        List<WorkEvent> weekEvents = workEventRepository.findByUserIdAndDateRange(userId, weekStartTime, weekEndTime);
        List<Reminder> weekReminders = reminderRepository.findByUserIdAndDateRange(userId, weekStartTime, weekEndTime);

        int busyDays = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate day = weekStart.plusDays(i);
            OffsetDateTime dayStart = day.atStartOfDay(zoneId).toOffsetDateTime();
            OffsetDateTime dayEnd = day.plusDays(1).atStartOfDay(zoneId).toOffsetDateTime();

            long dayEventCount = weekEvents.stream()
                .filter(e -> e.getStartTime().isBefore(dayEnd) && e.getEndTime().isAfter(dayStart))
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

    private ZoneId resolveUserZone(UUID userId) {
        return userProfileRepository.findById(userId)
            .map(UserProfile::getTimezone)
            .filter(tz -> tz != null && !tz.isBlank())
            .map(this::safeZoneId)
            .orElse(ZoneId.of("Europe/Istanbul"));
    }

    private ZoneId safeZoneId(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (Exception ignored) {
            return ZoneId.of("Europe/Istanbul");
        }
    }
}
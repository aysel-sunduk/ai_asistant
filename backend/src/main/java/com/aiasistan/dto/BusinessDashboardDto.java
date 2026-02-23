/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;

/**
 * DTO: İş paneli (dashboard) için özet veriler.
 */
public class BusinessDashboardDto {

    public static class Statistics {
        private Long totalEvents;
        private Long upcomingEvents;
        private Long ongoingEvents;
        private Long totalReminders;
        private Long scheduledReminders;
        private Long todayEvents;
        private Long thisWeekEvents;
        private Long overdueReminders;

        public Long getTotalEvents() { return totalEvents; }
        public void setTotalEvents(Long totalEvents) { this.totalEvents = totalEvents; }
        public Long getUpcomingEvents() { return upcomingEvents; }
        public void setUpcomingEvents(Long upcomingEvents) { this.upcomingEvents = upcomingEvents; }
        public Long getOngoingEvents() { return ongoingEvents; }
        public void setOngoingEvents(Long ongoingEvents) { this.ongoingEvents = ongoingEvents; }
        public Long getTotalReminders() { return totalReminders; }
        public void setTotalReminders(Long totalReminders) { this.totalReminders = totalReminders; }
        public Long getScheduledReminders() { return scheduledReminders; }
        public void setScheduledReminders(Long scheduledReminders) { this.scheduledReminders = scheduledReminders; }
        public Long getTodayEvents() { return todayEvents; }
        public void setTodayEvents(Long todayEvents) { this.todayEvents = todayEvents; }
        public Long getThisWeekEvents() { return thisWeekEvents; }
        public void setThisWeekEvents(Long thisWeekEvents) { this.thisWeekEvents = thisWeekEvents; }
        public Long getOverdueReminders() { return overdueReminders; }
        public void setOverdueReminders(Long overdueReminders) { this.overdueReminders = overdueReminders; }
    }

    public static class TodaySummary {
        private Long totalEvents;
        private Long completedEvents;
        private Long upcomingEvents;
        private Long dueReminders;
        private WorkEventDto.Response nextEvent;
        private ReminderDto.Response nextReminder;

        public Long getTotalEvents() { return totalEvents; }
        public void setTotalEvents(Long totalEvents) { this.totalEvents = totalEvents; }
        public Long getCompletedEvents() { return completedEvents; }
        public void setCompletedEvents(Long completedEvents) { this.completedEvents = completedEvents; }
        public Long getUpcomingEvents() { return upcomingEvents; }
        public void setUpcomingEvents(Long upcomingEvents) { this.upcomingEvents = upcomingEvents; }
        public Long getDueReminders() { return dueReminders; }
        public void setDueReminders(Long dueReminders) { this.dueReminders = dueReminders; }
        public WorkEventDto.Response getNextEvent() { return nextEvent; }
        public void setNextEvent(WorkEventDto.Response nextEvent) { this.nextEvent = nextEvent; }
        public ReminderDto.Response getNextReminder() { return nextReminder; }
        public void setNextReminder(ReminderDto.Response nextReminder) { this.nextReminder = nextReminder; }
    }

    public static class WeeklyOverview {
        private OffsetDateTime weekStart;
        private OffsetDateTime weekEnd;
        private Long totalEvents;
        private Long totalReminders;
        private Integer busyDays;
        private Integer freeDays;

        public OffsetDateTime getWeekStart() { return weekStart; }
        public void setWeekStart(OffsetDateTime weekStart) { this.weekStart = weekStart; }
        public OffsetDateTime getWeekEnd() { return weekEnd; }
        public void setWeekEnd(OffsetDateTime weekEnd) { this.weekEnd = weekEnd; }
        public Long getTotalEvents() { return totalEvents; }
        public void setTotalEvents(Long totalEvents) { this.totalEvents = totalEvents; }
        public Long getTotalReminders() { return totalReminders; }
        public void setTotalReminders(Long totalReminders) { this.totalReminders = totalReminders; }
        public Integer getBusyDays() { return busyDays; }
        public void setBusyDays(Integer busyDays) { this.busyDays = busyDays; }
        public Integer getFreeDays() { return freeDays; }
        public void setFreeDays(Integer freeDays) { this.freeDays = freeDays; }
    }
}
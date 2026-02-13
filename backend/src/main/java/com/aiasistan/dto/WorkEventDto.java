package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import com.aiasistan.model.WorkEvent;
import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class WorkEventDto {

    @Schema(name = "WorkEventRequest")
    public static class Request {
        @NotBlank(message = "Baslik bos olamaz")
        @Size(max = 500, message = "Baslik en fazla 500 karakter olabilir")
        private String title;
        
        @Size(max = 5000, message = "Aciklama en fazla 5000 karakter olabilir")
        private String description;

        @NotNull(message = "Baslangic zamani bos olamaz")
        private OffsetDateTime startTime;

        @NotNull(message = "Bitis zamani bos olamaz")
        private OffsetDateTime endTime;

        @Min(value = 0, message = "Katilimci sayisi negatif olamaz")
        private Integer participantCount;
        
        @Size(max = 500, message = "Konum en fazla 500 karakter olabilir")
        private String location;
        
        @Pattern(regexp = "(?i)^(SCHEDULED|ONGOING|COMPLETED|CANCELLED|POSTPONED)$", 
                 message = "Gecersiz durum")
        private String status;
        
        @Pattern(regexp = "(?i)^(LOW|MEDIUM|HIGH|URGENT)$", 
                 message = "Gecersiz oncelik")
        private String priority;
        
        @Pattern(regexp = "(?i)^(MEETING|CONFERENCE|PRESENTATION|INTERVIEW|TRAINING|WORKSHOP|CLIENT_MEETING|TEAM_MEETING|ONE_ON_ONE|BRAINSTORMING|REVIEW|OTHER)$",
                 message = "Gecersiz toplanti tipi")
        private String eventType;
        
        private Boolean isOnline;
        
        @Pattern(regexp = "^(https?://)?[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$|^$", 
                 message = "Gecersiz URL formati")
        @Size(max = 1000, message = "Meeting URL en fazla 1000 karakter olabilir")
        private String meetingUrl;
        
        @Min(value = 0, message = "Hatirlatma suresi negatif olamaz")
        private Integer reminderMinutesBefore;
        
        private Map<String, Object> metadata;
        
        @Size(max = 5000, message = "Notlar en fazla 5000 karakter olabilir")
        private String notes;

        // GETTERS & SETTERS
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public OffsetDateTime getStartTime() { return startTime; }
        public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
        
        public OffsetDateTime getEndTime() { return endTime; }
        public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
        
        public Integer getParticipantCount() { return participantCount; }
        public void setParticipantCount(Integer participantCount) { this.participantCount = participantCount; }
        
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        
        public Boolean getIsOnline() { return isOnline; }
        public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }
        
        public String getMeetingUrl() { return meetingUrl; }
        public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
        
        public Integer getReminderMinutesBefore() { return reminderMinutesBefore; }
        public void setReminderMinutesBefore(Integer reminderMinutesBefore) { 
            this.reminderMinutesBefore = reminderMinutesBefore; 
        }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    @Schema(name = "WorkEventResponse")
    public static class Response {
        private UUID id;
        private UUID userId;
        private String title;
        private String description;

        private OffsetDateTime startTime;

        private OffsetDateTime endTime;

        private Integer participantCount;
        private String location;
        private String status;
        private String priority;
        private String eventType;
        private Boolean isOnline;
        private String meetingUrl;
        private Boolean reminderSent;
        private Integer reminderMinutesBefore;
        private Map<String, Object> metadata;
        private String notes;
        private Long durationMinutes;

        private OffsetDateTime createdAt;

        private OffsetDateTime updatedAt;

        public static Response from(WorkEvent event) {
            Response response = new Response();
            response.id = event.getId();
            response.userId = event.getUserId();
            response.title = event.getTitle();
            response.description = event.getDescription();
            response.startTime = event.getStartTime();
            response.endTime = event.getEndTime();
            response.participantCount = event.getParticipantCount();
            response.location = event.getLocation();
            response.status = event.getStatus();
            response.priority = event.getPriority();
            response.eventType = event.getEventType();
            response.isOnline = event.getIsOnline();
            response.meetingUrl = event.getMeetingUrl();
            response.reminderSent = event.getReminderSent();
            response.reminderMinutesBefore = event.getReminderMinutesBefore();
            response.metadata = event.getMetadata();
            response.notes = event.getNotes();
            response.createdAt = event.getCreatedAt();
            response.updatedAt = event.getUpdatedAt();
            
            // Toplantı süresini dakika olarak hesapla
            if (event.getStartTime() != null && event.getEndTime() != null) {
                response.durationMinutes = java.time.Duration.between(
                    event.getStartTime(), event.getEndTime()
                ).toMinutes();
            }
            
            return response;
        }

        // GETTERS & SETTERS
        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public OffsetDateTime getStartTime() { return startTime; }
        public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }
        
        public OffsetDateTime getEndTime() { return endTime; }
        public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }
        
        public Integer getParticipantCount() { return participantCount; }
        public void setParticipantCount(Integer participantCount) { this.participantCount = participantCount; }
        
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        
        public Boolean getIsOnline() { return isOnline; }
        public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }
        
        public String getMeetingUrl() { return meetingUrl; }
        public void setMeetingUrl(String meetingUrl) { this.meetingUrl = meetingUrl; }
        
        public Boolean getReminderSent() { return reminderSent; }
        public void setReminderSent(Boolean reminderSent) { this.reminderSent = reminderSent; }
        
        public Integer getReminderMinutesBefore() { return reminderMinutesBefore; }
        public void setReminderMinutesBefore(Integer reminderMinutesBefore) { 
            this.reminderMinutesBefore = reminderMinutesBefore; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
        
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        
        public Long getDurationMinutes() { return durationMinutes; }
        public void setDurationMinutes(Long durationMinutes) { this.durationMinutes = durationMinutes; }
        
        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
        
        public OffsetDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
    
    @Schema(name = "WorkEventSummary")
    public static class Summary {
        private Long totalEvents;
        private Long scheduledEvents;
        private Long completedEvents;
        private Long cancelledEvents;
        private Long upcomingEvents;
        private Long todayEvents;
        private Long thisWeekEvents;
        private Double averageDurationMinutes;
        private Integer totalParticipants;
        
        // GETTERS & SETTERS
        public Long getTotalEvents() { return totalEvents; }
        public void setTotalEvents(Long totalEvents) { this.totalEvents = totalEvents; }
        
        public Long getScheduledEvents() { return scheduledEvents; }
        public void setScheduledEvents(Long scheduledEvents) { this.scheduledEvents = scheduledEvents; }
        
        public Long getCompletedEvents() { return completedEvents; }
        public void setCompletedEvents(Long completedEvents) { this.completedEvents = completedEvents; }
        
        public Long getCancelledEvents() { return cancelledEvents; }
        public void setCancelledEvents(Long cancelledEvents) { this.cancelledEvents = cancelledEvents; }
        
        public Long getUpcomingEvents() { return upcomingEvents; }
        public void setUpcomingEvents(Long upcomingEvents) { this.upcomingEvents = upcomingEvents; }
        
        public Long getTodayEvents() { return todayEvents; }
        public void setTodayEvents(Long todayEvents) { this.todayEvents = todayEvents; }
        
        public Long getThisWeekEvents() { return thisWeekEvents; }
        public void setThisWeekEvents(Long thisWeekEvents) { this.thisWeekEvents = thisWeekEvents; }
        
        public Double getAverageDurationMinutes() { return averageDurationMinutes; }
        public void setAverageDurationMinutes(Double averageDurationMinutes) { 
            this.averageDurationMinutes = averageDurationMinutes; 
        }
        
        public Integer getTotalParticipants() { return totalParticipants; }
        public void setTotalParticipants(Integer totalParticipants) { 
            this.totalParticipants = totalParticipants; 
        }
    }
}

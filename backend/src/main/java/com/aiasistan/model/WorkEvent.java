/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import com.aiasistan.common.BaseEntity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "work_events", indexes = {
    @Index(name = "idx_work_events_user_id", columnList = "user_id"),
    @Index(name = "idx_work_events_start_time", columnList = "start_time"),
    @Index(name = "idx_work_events_user_start", columnList = "user_id, start_time"),
    @Index(name = "idx_work_events_status", columnList = "status")
})
@Where(clause = "deleted_at IS NULL")
public class WorkEvent extends BaseEntity {
    
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "text")
    private String description;
    
    @Column(name = "start_time", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime startTime;
    
    @Column(name = "end_time", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime endTime;
    
    @Column(name = "participant_count")
    private Integer participantCount = 0;
    
    @Column(length = 500)
    private String location;
    
    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED"; // SCHEDULED, ONGOING, COMPLETED, CANCELLED, POSTPONED
    
    @Column(nullable = false, length = 20)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT
    
    @Column(name = "event_type", length = 50)
    private String eventType; // MEETING, CONFERENCE, PRESENTATION, INTERVIEW, TRAINING, etc.
    
    @Column(name = "is_online")
    private Boolean isOnline = false;
    
    @Column(name = "meeting_url", length = 1000)
    private String meetingUrl;
    
    @Column(name = "reminder_sent")
    private Boolean reminderSent = false;
    
    @Column(name = "reminder_minutes_before")
    private Integer reminderMinutesBefore = 15;
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;
    
    @Column(columnDefinition = "text")
    private String notes;

    public WorkEvent() {}

    // GETTERS & SETTERS
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
    public void setReminderMinutesBefore(Integer reminderMinutesBefore) { this.reminderMinutesBefore = reminderMinutesBefore; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WorkEvent workEvent)) return false;
        return Objects.equals(getId(), workEvent.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }

    @Override
    public String toString() {
        return "WorkEvent{id=" + getId() + 
               ", title='" + title + '\'' + 
               ", status=" + status + 
               ", priority=" + priority + 
               ", startTime=" + startTime + '}';
    }
}

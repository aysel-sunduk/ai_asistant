package com.aiasistan.model;

import com.aiasistan.common.BaseEntity; // BU SATIR ŞART!
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.Objects;

import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "work_events")
public class WorkEvent extends BaseEntity {
    
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "text")
    private String description;
    
    @Column(name = "start_time", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime startTime;
    
    @Column(name = "end_time", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime endTime;
    
    @Column(name = "participant_count")
    private Integer participantCount = 0;
    
    @Column
    private String location;
    
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

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
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WorkEvent)) return false;
        if (!super.equals(o)) return false;
        WorkEvent workEvent = (WorkEvent) o;
        return Objects.equals(userId, workEvent.userId) && Objects.equals(title, workEvent.title);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), userId, title);
    }

    @Override
    public String toString() {
        return "WorkEvent{title='" + title + "'}";
    }
}
/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.aiasistan.common.BaseEntity;
import org.hibernate.annotations.Where;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "reminders")
@Where(clause = "deleted_at IS NULL")
public class Reminder extends BaseEntity {

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "work_event_id", columnDefinition = "uuid")
    private UUID workEventId;

    @Column(name = "contact_id", columnDefinition = "uuid")
    private UUID contactId;

    @Column(name = "title", nullable = false, columnDefinition = "text")
    private String title;

    @Column(name = "remind_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime remindAt;

    @Column(name = "recurrence", columnDefinition = "text")
    private String recurrence;

    @Column(name = "source_module", columnDefinition = "text")
    private String sourceModule;

    @Column(name = "channel", columnDefinition = "text")
    private String channel = "in_app";

    @Column(name = "status", columnDefinition = "text")
    private String status = "scheduled";

    @Column(name = "google_calendar_event_id", length = 255)
    private String googleCalendarEventId;

    public Reminder() {}

    public Reminder(UUID userId, UUID workEventId, UUID contactId, String sourceModule,
                    String title, OffsetDateTime remindAt, String recurrence,
                    String channel, String status) {
        this.userId = userId;
        this.workEventId = workEventId;
        this.contactId = contactId;
        this.sourceModule = sourceModule;
        this.title = title;
        this.remindAt = remindAt;
        this.recurrence = recurrence;
        this.channel = channel;
        this.status = status;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getWorkEventId() { return workEventId; }
    public void setWorkEventId(UUID workEventId) { this.workEventId = workEventId; }

    public UUID getContactId() { return contactId; }
    public void setContactId(UUID contactId) { this.contactId = contactId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public OffsetDateTime getRemindAt() { return remindAt; }
    public void setRemindAt(OffsetDateTime remindAt) { this.remindAt = remindAt; }

    public String getRecurrence() { return recurrence; }
    public void setRecurrence(String recurrence) { this.recurrence = recurrence; }

    public String getSourceModule() { return sourceModule; }
    public void setSourceModule(String sourceModule) { this.sourceModule = sourceModule; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getGoogleCalendarEventId() { return googleCalendarEventId; }
    public void setGoogleCalendarEventId(String googleCalendarEventId) { this.googleCalendarEventId = googleCalendarEventId; }
}

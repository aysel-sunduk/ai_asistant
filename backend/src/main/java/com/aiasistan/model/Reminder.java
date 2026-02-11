package com.aiasistan.model;

import com.aiasistan.common.enums.ModuleKey;
import com.aiasistan.common.enums.ReminderChannel;
import com.aiasistan.common.enums.ReminderStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.aiasistan.common.BaseEntity;

@Entity
@Table(name = "reminders")
public class Reminder extends BaseEntity {
    
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;
    
    @Column(name = "work_event_id", columnDefinition = "uuid")
    private UUID workEventId;
    
    @Column(name = "contact_id", columnDefinition = "uuid")
    private UUID contactId;
    
    @Convert(converter = ModuleKeyConverter.class)
    @Column(name = "source_module", columnDefinition = "module_key")
    private ModuleKey sourceModule;
    
    @Column(nullable = false)
    private String title;
    
    @Column(name = "remind_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime remindAt;
    
    @Column
    private String recurrence;
    
    @Convert(converter = ReminderChannelConverter.class)
    @Column(columnDefinition = "reminder_channel")
    private ReminderChannel channel = ReminderChannel.IN_APP;
    
    @Convert(converter = ReminderStatusConverter.class)
    @Column(columnDefinition = "reminder_status")
    private ReminderStatus status = ReminderStatus.SCHEDULED;

    public Reminder() {
    }

    public Reminder(
        UUID userId,
        UUID workEventId,
        UUID contactId,
        ModuleKey sourceModule,
        String title,
        OffsetDateTime remindAt,
        String recurrence,
        ReminderChannel channel,
        ReminderStatus status
    ) {
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
    
    @Converter
    public static class ModuleKeyConverter implements AttributeConverter<ModuleKey, String> {
        @Override
        public String convertToDatabaseColumn(ModuleKey attribute) {
            return attribute == null ? null : attribute.name().toLowerCase();
        }

        @Override
        public ModuleKey convertToEntityAttribute(String dbData) {
            return dbData == null ? null : ModuleKey.valueOf(dbData.toUpperCase());
        }
    }

    @Converter
    public static class ReminderChannelConverter implements AttributeConverter<ReminderChannel, String> {
        @Override
        public String convertToDatabaseColumn(ReminderChannel attribute) {
            return attribute == null ? null : attribute.name().toLowerCase();
        }

        @Override
        public ReminderChannel convertToEntityAttribute(String dbData) {
            return dbData == null ? null : ReminderChannel.valueOf(dbData.toUpperCase());
        }
    }

    @Converter
    public static class ReminderStatusConverter implements AttributeConverter<ReminderStatus, String> {
        @Override
        public String convertToDatabaseColumn(ReminderStatus attribute) {
            return attribute == null ? null : attribute.name().toLowerCase();
        }

        @Override
        public ReminderStatus convertToEntityAttribute(String dbData) {
            return dbData == null ? null : ReminderStatus.valueOf(dbData.toUpperCase());
        }
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getWorkEventId() {
        return workEventId;
    }

    public void setWorkEventId(UUID workEventId) {
        this.workEventId = workEventId;
    }

    public UUID getContactId() {
        return contactId;
    }

    public void setContactId(UUID contactId) {
        this.contactId = contactId;
    }

    public ModuleKey getSourceModule() {
        return sourceModule;
    }

    public void setSourceModule(ModuleKey sourceModule) {
        this.sourceModule = sourceModule;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public OffsetDateTime getRemindAt() {
        return remindAt;
    }

    public void setRemindAt(OffsetDateTime remindAt) {
        this.remindAt = remindAt;
    }

    public String getRecurrence() {
        return recurrence;
    }

    public void setRecurrence(String recurrence) {
        this.recurrence = recurrence;
    }

    public ReminderChannel getChannel() {
        return channel;
    }

    public void setChannel(ReminderChannel channel) {
        this.channel = channel;
    }

    public ReminderStatus getStatus() {
        return status;
    }

    public void setStatus(ReminderStatus status) {
        this.status = status;
    }
}

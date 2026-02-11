package com.aiasistan.dto;

import com.aiasistan.common.enums.ModuleKey;
import com.aiasistan.common.enums.ReminderChannel;
import com.aiasistan.common.enums.ReminderStatus;
import com.aiasistan.model.Reminder;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ReminderDto {

    public static class Request {
        @NotBlank(message = "Baslik bos olamaz")
        private String title;

        @NotNull(message = "Hatirlatma zamani bos olamaz")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        private OffsetDateTime remindAt;

        private UUID workEventId;
        private UUID contactId;
        private ModuleKey sourceModule;
        private String recurrence;
        private ReminderChannel channel;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public OffsetDateTime getRemindAt() { return remindAt; }
        public void setRemindAt(OffsetDateTime remindAt) { this.remindAt = remindAt; }
        public UUID getWorkEventId() { return workEventId; }
        public void setWorkEventId(UUID workEventId) { this.workEventId = workEventId; }
        public UUID getContactId() { return contactId; }
        public void setContactId(UUID contactId) { this.contactId = contactId; }
        public ModuleKey getSourceModule() { return sourceModule; }
        public void setSourceModule(ModuleKey sourceModule) { this.sourceModule = sourceModule; }
        public String getRecurrence() { return recurrence; }
        public void setRecurrence(String recurrence) { this.recurrence = recurrence; }
        public ReminderChannel getChannel() { return channel; }
        public void setChannel(ReminderChannel channel) { this.channel = channel; }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private UUID workEventId;
        private UUID contactId;
        private ModuleKey sourceModule;
        private String title;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        private OffsetDateTime remindAt;

        private String recurrence;
        private ReminderChannel channel;
        private ReminderStatus status;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        private OffsetDateTime createdAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        private OffsetDateTime updatedAt;

        public static Response from(Reminder reminder) {
            Response response = new Response();
            response.id = reminder.getId();
            response.userId = reminder.getUserId();
            response.workEventId = reminder.getWorkEventId();
            response.contactId = reminder.getContactId();
            response.sourceModule = reminder.getSourceModule();
            response.title = reminder.getTitle();
            response.remindAt = reminder.getRemindAt();
            response.recurrence = reminder.getRecurrence();
            response.channel = reminder.getChannel();
            response.status = reminder.getStatus();
            response.createdAt = reminder.getCreatedAt();
            response.updatedAt = reminder.getUpdatedAt();
            return response;
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public UUID getWorkEventId() { return workEventId; }
        public void setWorkEventId(UUID workEventId) { this.workEventId = workEventId; }
        public UUID getContactId() { return contactId; }
        public void setContactId(UUID contactId) { this.contactId = contactId; }
        public ModuleKey getSourceModule() { return sourceModule; }
        public void setSourceModule(ModuleKey sourceModule) { this.sourceModule = sourceModule; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public OffsetDateTime getRemindAt() { return remindAt; }
        public void setRemindAt(OffsetDateTime remindAt) { this.remindAt = remindAt; }
        public String getRecurrence() { return recurrence; }
        public void setRecurrence(String recurrence) { this.recurrence = recurrence; }
        public ReminderChannel getChannel() { return channel; }
        public void setChannel(ReminderChannel channel) { this.channel = channel; }
        public ReminderStatus getStatus() { return status; }
        public void setStatus(ReminderStatus status) { this.status = status; }
        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
        public OffsetDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}

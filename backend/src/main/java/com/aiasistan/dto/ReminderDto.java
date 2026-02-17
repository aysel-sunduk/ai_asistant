package com.aiasistan.dto;

import com.aiasistan.model.Reminder;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ReminderDto {

    @Schema(name = "ReminderRequest")
    public static class Request {
        @NotBlank(message = "Baslik bos olamaz")
        @Schema(example = "Yarin saat 10 toplanti hatirlat")
        private String title;

        @NotNull(message = "Hatirlatma zamani bos olamaz")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        @Schema(
            description = "ISO-8601 formatinda tarih/saat. Ornek: 2026-02-20T10:30:00+03:00",
            example = "2026-02-20T10:30:00+03:00"
        )
        private OffsetDateTime remindAt;

        @Schema(
            description = "Opsiyonel: bagli is etkinligi id. Sadece toplantiya bagli hatirlatici icin gonderilir.",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED,
            nullable = true
        )
        private UUID workEventId;
        @Schema(
            description = "Opsiyonel: bagli kisi id. Genel hatirlaticilarda gonderilmez.",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED,
            nullable = true
        )
        private UUID contactId;
        @Schema(
            description = "Hatirlaticinin geldigi modul. Bos gonderilirse varsayilan: general",
            allowableValues = {"general", "business", "work", "family", "health", "finance", "social", "shopping", "goals"},
            example = "business",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        private String sourceModule;
        @Schema(
            description = "Tekrar tipi. Bos gonderilirse varsayilan: none",
            allowableValues = {"none", "daily", "weekly", "monthly", "yearly", "weekdays", "custom"},
            example = "none",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        private String recurrence;
        @Schema(
            description = "Bildirim kanali. Bos gonderilirse varsayilan: in_app",
            allowableValues = {"in_app", "email", "push", "sms"},
            example = "in_app",
            requiredMode = Schema.RequiredMode.NOT_REQUIRED
        )
        private String channel;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public OffsetDateTime getRemindAt() { return remindAt; }
        public void setRemindAt(OffsetDateTime remindAt) { this.remindAt = remindAt; }
        public UUID getWorkEventId() { return workEventId; }
        public void setWorkEventId(UUID workEventId) { this.workEventId = workEventId; }
        public UUID getContactId() { return contactId; }
        public void setContactId(UUID contactId) { this.contactId = contactId; }
        public String getSourceModule() { return sourceModule; }
        public void setSourceModule(String sourceModule) { this.sourceModule = sourceModule; }
        public String getRecurrence() { return recurrence; }
        public void setRecurrence(String recurrence) { this.recurrence = recurrence; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
    }

    @Schema(name = "ReminderResponse")
    public static class Response {
        private UUID id;
        private UUID userId;
        private UUID workEventId;
        private UUID contactId;
        private String sourceModule;
        private String title;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
        private OffsetDateTime remindAt;

        private String recurrence;
        private String channel;
        private String status;

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
        public String getSourceModule() { return sourceModule; }
        public void setSourceModule(String sourceModule) { this.sourceModule = sourceModule; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public OffsetDateTime getRemindAt() { return remindAt; }
        public void setRemindAt(OffsetDateTime remindAt) { this.remindAt = remindAt; }
        public String getRecurrence() { return recurrence; }
        public void setRecurrence(String recurrence) { this.recurrence = recurrence; }
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
        public OffsetDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}

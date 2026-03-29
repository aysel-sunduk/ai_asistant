/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import com.aiasistan.model.HealthLog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO: Sağlık kayıtları (health logs) için veri taşıyıcı.
 */
public class HealthLogDto {

    public static class Request {
        @NotBlank(message = "Log tipi bos olamaz")
        private String logType;

        private LocalDate logDate;

        private String source;

        private String externalRecordId;

        @NotNull(message = "Veri alani bos olamaz")
        private Map<String, Object> data;

        public String getLogType() {
            return logType;
        }

        public void setLogType(String logType) {
            this.logType = logType;
        }

        public LocalDate getLogDate() {
            return logDate;
        }

        public void setLogDate(LocalDate logDate) {
            this.logDate = logDate;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getExternalRecordId() {
            return externalRecordId;
        }

        public void setExternalRecordId(String externalRecordId) {
            this.externalRecordId = externalRecordId;
        }

        public Map<String, Object> getData() {
            return data;
        }

        public void setData(Map<String, Object> data) {
            this.data = data;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String logType;
        private LocalDate logDate;
        private String source;
        private String externalRecordId;
        private Map<String, Object> data;
        private OffsetDateTime loggedAt;
        private boolean isFavorite;

        public static Response from(HealthLog healthLog) {
            Response response = new Response();
            response.id = healthLog.getId();
            response.userId = healthLog.getUserId();
            response.logType = healthLog.getLogType();
            response.logDate = healthLog.getLogDate();
            response.source = healthLog.getSource();
            response.externalRecordId = healthLog.getExternalRecordId();
            response.data = healthLog.getData();
            response.loggedAt = healthLog.getLoggedAt();
            response.isFavorite = healthLog.isFavorite();
            return response;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getLogType() {
            return logType;
        }

        public void setLogType(String logType) {
            this.logType = logType;
        }

        public LocalDate getLogDate() {
            return logDate;
        }

        public void setLogDate(LocalDate logDate) {
            this.logDate = logDate;
        }

        public String getSource() {
            return source;
        }

        public void setSource(String source) {
            this.source = source;
        }

        public String getExternalRecordId() {
            return externalRecordId;
        }

        public void setExternalRecordId(String externalRecordId) {
            this.externalRecordId = externalRecordId;
        }

        public Map<String, Object> getData() {
            return data;
        }

        public void setData(Map<String, Object> data) {
            this.data = data;
        }

        public OffsetDateTime getLoggedAt() {
            return loggedAt;
        }

        public void setLoggedAt(OffsetDateTime loggedAt) {
            this.loggedAt = loggedAt;
        }

        public boolean isFavorite() {
            return isFavorite;
        }

        public void setFavorite(boolean favorite) {
            isFavorite = favorite;
        }
    }
}
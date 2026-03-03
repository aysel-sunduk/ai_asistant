package com.aiasistan.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleCalendarDto {

    public static class ConnectRequest {
        @NotBlank(message = "code zorunludur")
        private String code;

        @NotBlank(message = "redirectUri zorunludur")
        private String redirectUri;

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getRedirectUri() {
            return redirectUri;
        }

        public void setRedirectUri(String redirectUri) {
            this.redirectUri = redirectUri;
        }
    }

    public static class AuthUrlResponse {
        private String authUrl;

        public String getAuthUrl() {
            return authUrl;
        }

        public void setAuthUrl(String authUrl) {
            this.authUrl = authUrl;
        }
    }

    public static class StatusResponse {
        private boolean connected;
        private String connectedAt;
        private String expiresAt;
        private String selectedCalendarId;
        private String selectedCalendarSummary;

        public boolean isConnected() {
            return connected;
        }

        public void setConnected(boolean connected) {
            this.connected = connected;
        }

        public String getConnectedAt() {
            return connectedAt;
        }

        public void setConnectedAt(String connectedAt) {
            this.connectedAt = connectedAt;
        }

        public String getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(String expiresAt) {
            this.expiresAt = expiresAt;
        }

        public String getSelectedCalendarId() {
            return selectedCalendarId;
        }

        public void setSelectedCalendarId(String selectedCalendarId) {
            this.selectedCalendarId = selectedCalendarId;
        }

        public String getSelectedCalendarSummary() {
            return selectedCalendarSummary;
        }

        public void setSelectedCalendarSummary(String selectedCalendarSummary) {
            this.selectedCalendarSummary = selectedCalendarSummary;
        }
    }

    public static class CalendarItem {
        private String id;
        private String summary;
        private String primary;
        private String accessRole;

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getSummary() {
            return summary;
        }

        public void setSummary(String summary) {
            this.summary = summary;
        }

        public String getPrimary() {
            return primary;
        }

        public void setPrimary(String primary) {
            this.primary = primary;
        }

        public String getAccessRole() {
            return accessRole;
        }

        public void setAccessRole(String accessRole) {
            this.accessRole = accessRole;
        }
    }

    public static class SelectCalendarRequest {
        @NotBlank(message = "calendarId zorunludur")
        private String calendarId;

        private String calendarSummary;

        public String getCalendarId() {
            return calendarId;
        }

        public void setCalendarId(String calendarId) {
            this.calendarId = calendarId;
        }

        public String getCalendarSummary() {
            return calendarSummary;
        }

        public void setCalendarSummary(String calendarSummary) {
            this.calendarSummary = calendarSummary;
        }
    }

    public static class SelectCalendarResponse {
        private String selectedCalendarId;
        private String selectedCalendarSummary;

        public String getSelectedCalendarId() {
            return selectedCalendarId;
        }

        public void setSelectedCalendarId(String selectedCalendarId) {
            this.selectedCalendarId = selectedCalendarId;
        }

        public String getSelectedCalendarSummary() {
            return selectedCalendarSummary;
        }

        public void setSelectedCalendarSummary(String selectedCalendarSummary) {
            this.selectedCalendarSummary = selectedCalendarSummary;
        }
    }
}

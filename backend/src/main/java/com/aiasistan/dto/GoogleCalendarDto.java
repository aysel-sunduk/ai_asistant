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
    }
}

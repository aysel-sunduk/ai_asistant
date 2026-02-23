/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.aiasistan.model.MailDraft;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO: Taslak e-posta (mail draft) verileri.
 */
public class MailDraftDto {

    public static class Request {
        @NotBlank(message = "Alici e-posta zorunludur")
        @Email(message = "Gecerli bir e-posta girin")
        private String toEmail;

        private String[] ccEmails;
        private String[] bccEmails;

        @NotBlank(message = "Konu zorunludur")
        @Size(min = 3, max = 200, message = "Konu 3-200 karakter arasinda olmali")
        private String subject;

        private String purpose;
        private String tone;
        private String language;
        private List<Map<String, Object>> keyPoints;
        private String draftContent;
        private String status;

        public String getToEmail() { return toEmail; }
        public void setToEmail(String toEmail) { this.toEmail = toEmail; }
        public String[] getCcEmails() { return ccEmails; }
        public void setCcEmails(String[] ccEmails) { this.ccEmails = ccEmails; }
        public String[] getBccEmails() { return bccEmails; }
        public void setBccEmails(String[] bccEmails) { this.bccEmails = bccEmails; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public List<Map<String, Object>> getKeyPoints() { return keyPoints; }
        public void setKeyPoints(List<Map<String, Object>> keyPoints) { this.keyPoints = keyPoints; }
        public String getDraftContent() { return draftContent; }
        public void setDraftContent(String draftContent) { this.draftContent = draftContent; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class GenerateRequest {
        @NotBlank(message = "Alici e-posta zorunludur")
        @Email(message = "Gecerli bir e-posta girin")
        private String toEmail;

        @NotBlank(message = "Konu zorunludur")
        @Size(min = 3, max = 200, message = "Konu 3-200 karakter arasinda olmali")
        private String subject;

        private String purpose;
        private String tone;
        private String language;
        private List<Map<String, Object>> keyPoints;

        public String getToEmail() { return toEmail; }
        public void setToEmail(String toEmail) { this.toEmail = toEmail; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public List<Map<String, Object>> getKeyPoints() { return keyPoints; }
        public void setKeyPoints(List<Map<String, Object>> keyPoints) { this.keyPoints = keyPoints; }
    }

    public static class GenerateResponse {
        private String draftContent;

        public String getDraftContent() {
            return draftContent;
        }

        public void setDraftContent(String draftContent) {
            this.draftContent = draftContent;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String toEmail;
        private String[] ccEmails;
        private String[] bccEmails;
        private String subject;
        private String purpose;
        private String tone;
        private String language;
        private List<Map<String, Object>> keyPoints;
        private String draftContent;
        private String status;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public static Response from(MailDraft draft) {
            Response response = new Response();
            response.id = draft.getId();
            response.userId = draft.getUserId();
            response.toEmail = draft.getToEmail();
            response.ccEmails = draft.getCcEmails();
            response.bccEmails = draft.getBccEmails();
            response.subject = draft.getSubject();
            response.purpose = draft.getPurpose();
            response.tone = draft.getTone();
            response.language = draft.getLanguage();
            response.keyPoints = draft.getKeyPoints();
            response.draftContent = draft.getDraftContent();
            response.status = draft.getStatus();
            response.createdAt = draft.getCreatedAt();
            response.updatedAt = draft.getUpdatedAt();
            return response;
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public String getToEmail() { return toEmail; }
        public void setToEmail(String toEmail) { this.toEmail = toEmail; }
        public String[] getCcEmails() { return ccEmails; }
        public void setCcEmails(String[] ccEmails) { this.ccEmails = ccEmails; }
        public String[] getBccEmails() { return bccEmails; }
        public void setBccEmails(String[] bccEmails) { this.bccEmails = bccEmails; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getPurpose() { return purpose; }
        public void setPurpose(String purpose) { this.purpose = purpose; }
        public String getTone() { return tone; }
        public void setTone(String tone) { this.tone = tone; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
        public List<Map<String, Object>> getKeyPoints() { return keyPoints; }
        public void setKeyPoints(List<Map<String, Object>> keyPoints) { this.keyPoints = keyPoints; }
        public String getDraftContent() { return draftContent; }
        public void setDraftContent(String draftContent) { this.draftContent = draftContent; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public OffsetDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
        public OffsetDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    }
}
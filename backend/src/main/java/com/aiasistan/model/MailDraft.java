package com.aiasistan.model;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.Type;

import com.aiasistan.common.BaseEntity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "mail_drafts")
public class MailDraft extends BaseEntity {

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "to_email", nullable = false)
    private String toEmail;

    @Column(name = "cc_emails", columnDefinition = "text[]")
    private String[] ccEmails;

    @Column(name = "bcc_emails", columnDefinition = "text[]")
    private String[] bccEmails;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "purpose")
    private String purpose;

    @Column(name = "tone")
    private String tone;

    @Column(name = "language", length = 16)
    private String language = "tr";

    @Type(JsonBinaryType.class)
    @Column(name = "key_points", columnDefinition = "jsonb")
    private List<Map<String, Object>> keyPoints;

    @Column(name = "draft_content", columnDefinition = "text")
    private String draftContent;

    @Column(name = "status", length = 32)
    private String status = "draft";

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getToEmail() {
        return toEmail;
    }

    public void setToEmail(String toEmail) {
        this.toEmail = toEmail;
    }

    public String[] getCcEmails() {
        return ccEmails;
    }

    public void setCcEmails(String[] ccEmails) {
        this.ccEmails = ccEmails;
    }

    public String[] getBccEmails() {
        return bccEmails;
    }

    public void setBccEmails(String[] bccEmails) {
        this.bccEmails = bccEmails;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getTone() {
        return tone;
    }

    public void setTone(String tone) {
        this.tone = tone;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public List<Map<String, Object>> getKeyPoints() {
        return keyPoints;
    }

    public void setKeyPoints(List<Map<String, Object>> keyPoints) {
        this.keyPoints = keyPoints;
    }

    public String getDraftContent() {
        return draftContent;
    }

    public void setDraftContent(String draftContent) {
        this.draftContent = draftContent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

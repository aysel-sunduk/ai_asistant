/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import com.aiasistan.common.UserOwnedEntity;
import org.hibernate.annotations.Where;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "family_birthdays")
@Where(clause = "deleted_at IS NULL")
public class FamilyBirthday extends UserOwnedEntity {

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "relationship", length = 60)
    private String relationship;

    @Column(name = "birth_date", nullable = false)
    private java.time.LocalDate birthDate;

    @Column(name = "reminder_time")
    private java.time.LocalTime reminderTime = java.time.LocalTime.of(9, 0);

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "note", columnDefinition = "text")
    private String note;

    @Column(name = "blood_type", length = 5)
    private String bloodType;

    @Column(name = "relation_degree", length = 30)
    private String relationDegree;

    @Column(name = "google_calendar_event_id", length = 255)
    private String googleCalendarEventId;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(java.time.LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public java.time.LocalTime getReminderTime() {
        return reminderTime;
    }

    public void setReminderTime(java.time.LocalTime reminderTime) {
        this.reminderTime = reminderTime;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getBloodType() {
        return bloodType;
    }

    public void setBloodType(String bloodType) {
        this.bloodType = bloodType;
    }

    public String getRelationDegree() {
        return relationDegree;
    }

    public void setRelationDegree(String relationDegree) {
        this.relationDegree = relationDegree;
    }

    public String getGoogleCalendarEventId() {
        return googleCalendarEventId;
    }

    public void setGoogleCalendarEventId(String googleCalendarEventId) {
        this.googleCalendarEventId = googleCalendarEventId;
    }
}

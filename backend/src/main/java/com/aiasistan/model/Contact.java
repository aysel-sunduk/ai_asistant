/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import com.aiasistan.common.BaseEntity;
import org.hibernate.annotations.Where;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contacts")
@Where(clause = "deleted_at IS NULL")
public class Contact extends BaseEntity {

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name;

    @Column(name = "relationship", columnDefinition = "text")
    private String relationship;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "phone", columnDefinition = "text")
    private String phone;

    @Column(name = "email", columnDefinition = "text")
    private String email;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "blood_type", columnDefinition = "text")
    private String bloodType;

    @Column(name = "relation_degree", columnDefinition = "text")
    private String relationDegree;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
}

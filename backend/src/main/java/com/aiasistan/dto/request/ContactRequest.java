package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class ContactRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String relationship;
    private LocalDate birthDate;
    private String phone;
    private String email;
    private String notes;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}

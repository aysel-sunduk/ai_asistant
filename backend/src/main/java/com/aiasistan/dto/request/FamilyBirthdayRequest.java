/**
* Kisa aciklama: Ortak uygulama parcasidir.
*/

package com.aiasistan.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO: Aile doğum günü (ekleme/güncelleme) isteği.
 */
public class FamilyBirthdayRequest {

  @NotBlank(message = "Full name is required")
  private String fullName;

  private String relationship;

  @NotNull(message = "Birth date is required")
  private LocalDate birthDate;

  private String phone;
  private String email;
  private String note;
  private String bloodType;
  private String relationDegree;

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
}
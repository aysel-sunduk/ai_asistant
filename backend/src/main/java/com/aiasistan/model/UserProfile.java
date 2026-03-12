/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    // Bire bir ilişki tanımı
    @OneToOne
    @MapsId // userId alanını User'ın id'si ile eşleştirir
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "gender")
    private String gender;

    @Column(name = "timezone")
    private String timezone = "Europe/Istanbul";

    @Column(name = "locale")
    private String locale = "tr-TR";

    @Column(name = "profile_visibility")
    private String profileVisibility = "public";

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private BigDecimal weightKg;

    @Column(name = "preferred_currency", columnDefinition = "text")
    private String preferredCurrency = "TRY";

    @Column(name = "monthly_income_estimate_minor")
    private Long monthlyIncomeEstimateMinor;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "show_phone")
    private boolean showPhone = false;

    @Column(name = "show_email")
    private boolean showEmail = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interests", columnDefinition = "jsonb")
    private Map<String, Object> interests;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "onboarding", columnDefinition = "jsonb")
    private Map<String, Object> onboarding;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notifications", columnDefinition = "jsonb")
    private Map<String, Object> notifications = Map.of(
            "email", true,
            "push", true,
            "sms", false);

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "activity_level")
    private String activityLevel;

    @Column(name = "body_type", length = 20)
    private String bodyType;

    @Column(name = "bmi")
    private Double bmi;

    @Column(name = "bmr")
    private Integer bmr;

    @Column(name = "body_fat_percentage")
    private Double bodyFatPercentage;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    public UserProfile() {
    }

    // Getters & Setters
    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public String getProfileVisibility() {
        return profileVisibility;
    }

    public void setProfileVisibility(String profileVisibility) {
        this.profileVisibility = profileVisibility;
    }

    public Integer getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Integer heightCm) {
        this.heightCm = heightCm;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public String getPreferredCurrency() {
        return preferredCurrency;
    }

    public void setPreferredCurrency(String preferredCurrency) {
        this.preferredCurrency = preferredCurrency;
    }

    public Long getMonthlyIncomeEstimateMinor() {
        return monthlyIncomeEstimateMinor;
    }

    public void setMonthlyIncomeEstimateMinor(Long monthlyIncomeEstimateMinor) {
        this.monthlyIncomeEstimateMinor = monthlyIncomeEstimateMinor;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public void setProfilePictureUrl(String profilePictureUrl) {
        this.profilePictureUrl = profilePictureUrl;
    }

    public Map<String, Object> getInterests() {
        return interests;
    }

    public void setInterests(Map<String, Object> interests) {
        this.interests = interests;
    }

    public Map<String, Object> getOnboarding() {
        return onboarding;
    }

    public void setOnboarding(Map<String, Object> onboarding) {
        this.onboarding = onboarding;
    }

    public Map<String, Object> getNotifications() {
        return notifications;
    }

    public void setNotifications(Map<String, Object> notifications) {
        this.notifications = notifications;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public boolean isShowPhone() {
        return showPhone;
    }

    public void setShowPhone(boolean showPhone) {
        this.showPhone = showPhone;
    }

    public boolean isShowEmail() {
        return showEmail;
    }

    public void setShowEmail(boolean showEmail) {
        this.showEmail = showEmail;
    }

    public String getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }

    public String getBodyType() {
        return bodyType;
    }

    public void setBodyType(String bodyType) {
        this.bodyType = bodyType;
    }

    public Double getBmi() {
        return bmi;
    }

    public void setBmi(Double bmi) {
        this.bmi = bmi;
    }

    public Integer getBmr() {
        return bmr;
    }

    public void setBmr(Integer bmr) {
        this.bmr = bmr;
    }

    public Double getBodyFatPercentage() {
        return bodyFatPercentage;
    }

    public void setBodyFatPercentage(Double bodyFatPercentage) {
        this.bodyFatPercentage = bodyFatPercentage;
    }
}
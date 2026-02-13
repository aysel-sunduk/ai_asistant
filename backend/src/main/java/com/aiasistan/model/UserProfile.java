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

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private BigDecimal weightKg;

    @Column(name = "preferred_currency", columnDefinition = "text")
    private String preferredCurrency = "TRY";

    @Column(name = "monthly_income_estimate_minor")
    private Long monthlyIncomeEstimateMinor;

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
        "sms", false
    );

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public UserProfile() {}

    // Getters & Setters
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    public Integer getHeightCm() { return heightCm; }
    public void setHeightCm(Integer heightCm) { this.heightCm = heightCm; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public String getPreferredCurrency() { return preferredCurrency; }
    public void setPreferredCurrency(String preferredCurrency) { this.preferredCurrency = preferredCurrency; }

    public Long getMonthlyIncomeEstimateMinor() { return monthlyIncomeEstimateMinor; }
    public void setMonthlyIncomeEstimateMinor(Long monthlyIncomeEstimateMinor) { this.monthlyIncomeEstimateMinor = monthlyIncomeEstimateMinor; }

    public Map<String, Object> getInterests() { return interests; }
    public void setInterests(Map<String, Object> interests) { this.interests = interests; }

    public Map<String, Object> getOnboarding() { return onboarding; }
    public void setOnboarding(Map<String, Object> onboarding) { this.onboarding = onboarding; }

    public Map<String, Object> getNotifications() { return notifications; }
    public void setNotifications(Map<String, Object> notifications) { this.notifications = notifications; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

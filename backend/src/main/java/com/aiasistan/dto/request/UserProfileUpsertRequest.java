/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * DTO: Kullanıcı profilini oluşturma/güncelleme isteği.
 */
public class UserProfileUpsertRequest {
    private String fullName;
    private LocalDate birthDate;
    private String gender;
    private String timezone;
    private String locale;
    private String profileVisibility;
    private Integer heightCm;
    private BigDecimal weightKg;
    private String preferredCurrency;
    private Long monthlyIncomeEstimateMinor;
    private Map<String, Object> interests;
    private Map<String, Object> onboarding;
    private Map<String, Object> notifications;
    private String phone;
    private Boolean showPhone;
    private Boolean showEmail;
    private String activityLevel;

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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Boolean getShowPhone() {
        return showPhone;
    }

    public void setShowPhone(Boolean showPhone) {
        this.showPhone = showPhone;
    }

    public Boolean getShowEmail() {
        return showEmail;
    }

    public void setShowEmail(Boolean showEmail) {
        this.showEmail = showEmail;
    }

    public String getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }
}
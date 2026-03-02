package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotNull;

public class ContactPrivacyUpdateRequest {
    @NotNull
    private Boolean showPhone;
    
    @NotNull
    private Boolean showEmail;

    // Getters & Setters
    public Boolean getShowPhone() { return showPhone; }
    public void setShowPhone(Boolean showPhone) { this.showPhone = showPhone; }
    public Boolean getShowEmail() { return showEmail; }
    public void setShowEmail(Boolean showEmail) { this.showEmail = showEmail; }
}
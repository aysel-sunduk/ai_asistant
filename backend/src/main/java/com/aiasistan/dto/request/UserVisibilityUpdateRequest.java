package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;

public class UserVisibilityUpdateRequest {

    @NotBlank(message = "visibility bos olamaz")
    private String visibility;

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }
}

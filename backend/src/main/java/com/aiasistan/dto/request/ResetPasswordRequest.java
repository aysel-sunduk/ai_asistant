package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {

    @NotBlank(message = "token zorunludur")
    private String token;

    @NotBlank(message = "password zorunludur")
    @Size(min = 6, max = 128, message = "password 6-128 karakter arasinda olmali")
    private String password;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

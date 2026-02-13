package com.aiasistan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ForgotPasswordRequest {
    @NotBlank(message = "Email bos olamaz")
    @Email(message = "Gecerli bir email adresi girin",
           regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    @Pattern(regexp = "^.*@.*$", message = "Email '@' icermelidir")
    private String email;

    @NotBlank(message = "Yeni sifre bos olamaz")
    @Size(min = 6, max = 128, message = "Sifre en az 6 karakter olmali")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,128}$",
        message = "Sifre en az 6 karakter olmali, en az 1 buyuk harf ve 1 ozel karakter icermelidir"
    )
    private String newPassword;

    public ForgotPasswordRequest() {}

    public ForgotPasswordRequest(String email, String newPassword) {
        this.email = email;
        this.newPassword = newPassword;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}

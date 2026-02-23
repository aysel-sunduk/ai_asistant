/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO: Şifremi unuttum isteği verileri.
 */
public class ForgotPasswordRequest {
    @Schema(example = "ahmet@example.com")
    @NotBlank(message = "Email bos olamaz")
    @Email(message = "Gecerli bir email adresi girin",
           regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    @Pattern(regexp = "^.*@.*$", message = "Email '@' icermelidir")
    private String email;

    public ForgotPasswordRequest() {}

    public ForgotPasswordRequest(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
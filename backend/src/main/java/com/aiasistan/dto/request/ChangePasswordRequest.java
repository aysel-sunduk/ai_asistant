/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO: Şifre değiştirme isteği verileri.
 */
public class ChangePasswordRequest {

    @Schema(example = "123456")
    @NotBlank(message = "Mevcut sifre bos olamaz")
    private String currentPassword;

    @Schema(example = "Abcde!")
    @NotBlank(message = "Yeni sifre bos olamaz")
    @Size(min = 6, max = 128, message = "Sifre en az 6 karakter olmali")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,128}$",
        message = "Sifre en az 6 karakter olmali, en az 1 buyuk harf ve 1 ozel karakter icermelidir"
    )
    private String newPassword;

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
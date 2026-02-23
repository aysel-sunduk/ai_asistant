/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO: Yenileme token isteği (refresh token request).
 */
public class RefreshTokenRequest {
    @NotBlank(message = "Refresh token boş olamaz")
    private String refreshToken;

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
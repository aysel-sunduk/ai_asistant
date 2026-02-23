/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

/**
 * DTO: Çıkış (logout) yanıtı.
 */
public class LogoutResponse {
    private String message;

    public LogoutResponse() {}

    public LogoutResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
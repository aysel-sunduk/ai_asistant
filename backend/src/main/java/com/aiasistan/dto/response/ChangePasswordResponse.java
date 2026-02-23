/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

/**
 * DTO: Şifre değiştirme isteği için yanıt.
 */
public class ChangePasswordResponse {

    private String email;
    private String message;

    public ChangePasswordResponse() {
    }

    public ChangePasswordResponse(String email, String message) {
        this.email = email;
        this.message = message;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

/**
 * DTO: Kayıt (register) isteği yanıtı.
 */
public class RegisterResponse {
    private String email;
    private String message;

    public RegisterResponse() {}

    public RegisterResponse(String email, String message) {
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
package com.aiasistan.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @Schema(example = "ahmet@example.com")
    @NotBlank(message = "Email bos olamaz")
    @Email(message = "Gecerli bir email adresi girin",
           regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    @Pattern(regexp = "^.*@.*$", message = "Email '@' icermelidir")
    private String email;

    @Schema(example = "Ahmet")
    @NotBlank(message = "Isim bos olamaz")
    @Size(min = 2, max = 50, message = "Isim 2-50 karakter arasinda olmali")
    @Pattern(regexp = "^[\\p{L} '-]+$", message = "Isim gecersiz karakter iceriyor")
    private String firstName;

    @Schema(example = "Yilmaz")
    @NotBlank(message = "Soyisim bos olamaz")
    @Size(min = 2, max = 50, message = "Soyisim 2-50 karakter arasinda olmali")
    @Pattern(regexp = "^[\\p{L} '-]+$", message = "Soyisim gecersiz karakter iceriyor")
    private String lastName;

    @Schema(example = "Abcde!")
    @NotBlank(message = "Sifre bos olamaz")
    @Size(min = 6, max = 128, message = "Sifre en az 6 karakter olmali")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,128}$",
        message = "Sifre en az 6 karakter olmali, en az 1 buyuk harf ve 1 ozel karakter icermelidir"
    )
    private String password;

    public RegisterRequest() {}

    public RegisterRequest(String email, String firstName, String lastName, String password) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}

/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.ChangePasswordRequest;
import com.aiasistan.dto.request.ForgotPasswordRequest;
import com.aiasistan.dto.request.LoginRequest;
import com.aiasistan.dto.request.RefreshTokenRequest;
import com.aiasistan.dto.request.RegisterRequest;
import com.aiasistan.dto.response.ChangePasswordResponse;
import com.aiasistan.dto.response.ForgotPasswordResponse;
import com.aiasistan.dto.response.LoginResponse;
import com.aiasistan.dto.response.LogoutResponse;
import com.aiasistan.dto.response.RefreshTokenResponse;
import com.aiasistan.dto.response.RegisterResponse;
import com.aiasistan.service.AuthService;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  @Operation(summary = "Giris yap")
  public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
    LoginResponse response = authService.login(request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Basariyla giris yapildi"));
  }

  @PostMapping("/register")
  @Operation(summary = "Kayit ol")
  public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
    RegisterResponse response = authService.register(request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Kullanici basariyla kaydedildi"));
  }

  @PostMapping("/forgot-password")
  @Operation(summary = "Sifre sifirlama talebi gonder")
  public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(
      @Valid @RequestBody ForgotPasswordRequest request) {
    ForgotPasswordResponse response = authService.forgotPassword(request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Gecici sifre e-postaya gonderildi"));
  }

  @PostMapping("/change-password")
  @Operation(summary = "Sifre degistir")
  public ResponseEntity<ApiResponse<ChangePasswordResponse>> changePassword(
      Authentication authentication,
      @Valid @RequestBody ChangePasswordRequest request) {
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error("Bu islem icin giris yapmaniz gerekiyor"));
    }
    ChangePasswordResponse response = authService.changePassword(authentication.getName(), request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Sifre basariyla degistirildi"));
  }

  @PostMapping("/refresh")
  @Operation(summary = "Token yenile")
  public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
    RefreshTokenResponse response = authService.refreshToken(request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Token basariyla yenilendi"));
  }

  @PostMapping("/logout")
  @Operation(summary = "Cikis yap")
  public ResponseEntity<ApiResponse<LogoutResponse>> logout(
      @RequestHeader(value = "Authorization", required = false) String authHeader) {

    String accessToken = null;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7);
    } else if (authHeader != null) {
      accessToken = authHeader;
    }

    if (accessToken == null || accessToken.trim().isEmpty()) {
      return ResponseEntity.badRequest()
          .body(ApiResponse.error("Access token gerekli!"));
    }

    LogoutResponse response = authService.logout(accessToken);
    return ResponseEntity.ok(ApiResponse.ok(response, "Basariyla cikis yapildi"));
  }
}


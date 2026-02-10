package com.aiasistan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.LoginRequest;
import com.aiasistan.dto.request.RefreshTokenRequest;
import com.aiasistan.dto.request.RegisterRequest;
import com.aiasistan.dto.response.LoginResponse;
import com.aiasistan.dto.response.LogoutResponse;
import com.aiasistan.dto.response.RefreshTokenResponse;
import com.aiasistan.dto.response.RegisterResponse;
import com.aiasistan.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Başarıyla giriş yapıldı"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Kullanıcı başarıyla kaydedildi"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Token başarıyla yenilendi"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<LogoutResponse>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // 1. Authorization header'dan token al (Bearer kaldırılıyor)
        String accessToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);  // "Bearer " kaldırıldı
        } else if (authHeader != null) {
            accessToken = authHeader;  // Bearer olmadan geldiyse direkt kullan
        }
        
        // 2. Token null'sa hata döndür
        if (accessToken == null || accessToken.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Access token gerekli!"));
        }
        
        LogoutResponse response = authService.logout(accessToken);
        return ResponseEntity.ok(ApiResponse.ok(response, "Başarıyla çıkış yapıldı"));
    }
}
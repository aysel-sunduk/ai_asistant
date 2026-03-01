package com.aiasistan.controller;

import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.PushTokenUpsertRequest;
import com.aiasistan.model.User;
import com.aiasistan.service.PushTokenService;
import com.aiasistan.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping({"/v1/users", "/users"})
public class UserPushTokenController {

    private final PushTokenService pushTokenService;
    private final UserService userService;

    public UserPushTokenController(PushTokenService pushTokenService, UserService userService) {
        this.pushTokenService = pushTokenService;
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Giris yapan kullaniciyi getir")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", user.getId());
        data.put("email", user.getEmail());
        data.put("username", user.getEmail());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("role", user.getRole());
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @PostMapping("/push-token")
    @Operation(summary = "Push token kaydet")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upsertPushToken(
            Authentication authentication,
            @Valid @RequestBody PushTokenUpsertRequest request) {
        Map<String, Object> data = pushTokenService.upsertPushToken(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(data, "Push token kaydedildi"));
    }
}

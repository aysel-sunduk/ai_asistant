/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.UserProfileUpsertRequest;
import com.aiasistan.dto.request.UserVisibilityUpdateRequest;
import com.aiasistan.dto.response.UserProfileResponse;
import com.aiasistan.model.User;
import com.aiasistan.service.UserProfileService;
import com.aiasistan.service.UserProfileService.ModuleCompletionStatus;
import com.aiasistan.service.UserService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/v1/profile")
public class ProfileController {

  private final UserProfileService userProfileService;
  private final UserService userService;

  public ProfileController(UserProfileService userProfileService, UserService userService) {
    this.userProfileService = userProfileService;
    this.userService = userService;
  }

  /**
   * ModÃ¼l bazlÄ± profil tamamlanma durumu
   * GET /v1/profile/completion
   */
  @GetMapping("/completion")
  @Operation(summary = "Tamamlanma durum listele")
  public ResponseEntity<ApiResponse<Map<String, ModuleCompletionStatus>>> getCompletionStatus(
      Authentication authentication) {
    
    String email = authentication.getName();
    UUID userId = userService.getUserIdByEmail(email);
    
    Map<String, ModuleCompletionStatus> status = 
      userProfileService.getModuleCompletionStatus(userId);
    
    return ResponseEntity.ok(ApiResponse.ok(status));
  }

  @GetMapping
  @Operation(summary = "Profil getir")
  public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication authentication) {
    String email = authentication.getName();
    UUID userId = userService.getUserIdByEmail(email);
    UserProfileResponse profile = userProfileService.getProfile(userId);
    return ResponseEntity.ok(ApiResponse.ok(profile));
  }

  @PutMapping
  @Operation(summary = "Profil ekle veya guncelle")
  public ResponseEntity<ApiResponse<UserProfileResponse>> upsertProfile(
      Authentication authentication,
      @RequestBody UserProfileUpsertRequest request) {
    String email = authentication.getName();
    UUID userId = userService.getUserIdByEmail(email);
    UserProfileResponse profile = userProfileService.upsertProfile(userId, request);
    return ResponseEntity.ok(ApiResponse.ok(profile, "Profile updated"));
  }

  @PatchMapping("/modules/{module}")
  @Operation(summary = "Modul profil ekle veya guncelle")
  public ResponseEntity<ApiResponse<UserProfileResponse>> upsertModuleProfile(
      Authentication authentication,
      @PathVariable String module,
      @RequestBody UserProfileUpsertRequest request) {
    String email = authentication.getName();
    UUID userId = userService.getUserIdByEmail(email);
    UserProfileResponse profile = userProfileService.upsertModuleProfile(userId, module, request);
    return ResponseEntity.ok(ApiResponse.ok(profile, "Module profile updated"));
  }

  @PatchMapping("/visibility")
  @Operation(summary = "Gorunurluk guncelle")
  public ResponseEntity<ApiResponse<Map<String, String>>> updateVisibility(
      Authentication authentication,
      @Valid @RequestBody UserVisibilityUpdateRequest request) {
    User updated = userService.updateVisibilityByEmail(authentication.getName(), request.getVisibility());
    Map<String, String> data = Map.of(
      "visibility", updated.getVisibility()
    );
    return ResponseEntity.ok(ApiResponse.ok(data, "Visibility updated"));
  }
}

/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.ContactPrivacyUpdateRequest;
import com.aiasistan.dto.request.UserProfileUpsertRequest;
import com.aiasistan.dto.request.UserVisibilityUpdateRequest;
import com.aiasistan.dto.response.UserProfileResponse;
import com.aiasistan.model.User;
import com.aiasistan.service.UserProfileService;
import com.aiasistan.service.UserProfileService.ModuleCompletionStatus;
import com.aiasistan.service.UserService;
import com.aiasistan.service.ImageService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/profile")
public class ProfileController {

  private final UserProfileService userProfileService;
  private final UserService userService;
  private final ImageService imageService;

  public ProfileController(UserProfileService userProfileService, UserService userService, ImageService imageService) {
    this.userProfileService = userProfileService;
    this.userService = userService;
    this.imageService = imageService;
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

  @PatchMapping("/contact-privacy")
@Operation(summary = "İletişim bilgilerinin görünürlüğünü güncelle (Telefon/Email)")
public ResponseEntity<ApiResponse<UserProfileResponse>> updateContactPrivacy(
        Authentication authentication,
        @Valid @RequestBody ContactPrivacyUpdateRequest request) {
    
    String email = authentication.getName();
    UUID userId = userService.getUserIdByEmail(email);
    
    UserProfileResponse response = userProfileService.updateContactPrivacy(userId, request);
    
    return ResponseEntity.ok(ApiResponse.ok(response, "İletişim gizlilik ayarları güncellendi."));
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

  private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ProfileController.class);

  @Operation(summary = "Profil fotoğrafı yükle")
  @org.springframework.web.bind.annotation.PostMapping(value = "/picture", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<UserProfileResponse>> uploadProfilePicture(
      Authentication authentication,
      @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
    
    try {
      String email = authentication.getName();
      UUID userId = userService.getUserIdByEmail(email);
      
      String pictureUrl = imageService.saveProfilePicture(file, userId);
      UserProfileResponse response = userProfileService.updateProfilePicture(userId, pictureUrl);
      
      return ResponseEntity.ok(ApiResponse.ok(response, "Profil fotoğrafı güncellendi"));
      
    } catch (org.springframework.web.multipart.MultipartException e) {
      logger.warn("Multipart isteği işlenemedi: {}", e.getMessage());
      return ResponseEntity.badRequest()
          .body(ApiResponse.error("Dosya yükleme başarısız: bağlantı kesildi veya dosya bozuk."));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest()
          .body(ApiResponse.error(e.getMessage()));
    } catch (Exception e) {
      logger.error("Profil fotoğrafı yüklenirken beklenmedik hata", e);
      return ResponseEntity.internalServerError()
          .body(ApiResponse.error("Sunucu hatası: " + e.getMessage()));
    }
  }
}

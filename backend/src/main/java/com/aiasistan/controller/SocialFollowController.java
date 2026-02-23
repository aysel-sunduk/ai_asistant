/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.FollowDto;
import com.aiasistan.service.SocialFollowService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import io.swagger.v3.oas.annotations.Operation;

@Validated
@RestController
@RequestMapping("/v1/social/follows")
public class SocialFollowController {

  private final SocialFollowService socialFollowService;

  public SocialFollowController(SocialFollowService socialFollowService) {
    this.socialFollowService = socialFollowService;
  }

  @PostMapping("/{targetUserId}")
  @Operation(summary = "Kullaniciyi takip et")
  public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> followUser(
    Authentication authentication,
    @PathVariable UUID targetUserId
  ) {
    FollowDto.FollowStateResponse response = socialFollowService.followUser(authentication.getName(), targetUserId);
    return ResponseEntity.ok(ApiResponse.ok(response, "Takip edildi"));
  }

  @DeleteMapping("/{targetUserId}")
  @Operation(summary = "Kullaniciyi takipten cikar")
  public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> unfollowUser(
    Authentication authentication,
    @PathVariable UUID targetUserId
  ) {
    FollowDto.FollowStateResponse response = socialFollowService.unfollowUser(authentication.getName(), targetUserId);
    return ResponseEntity.ok(ApiResponse.ok(response, "Takip birakildi"));
  }

  @GetMapping("/state/{targetUserId}")
  @Operation(summary = "Takip durumunu getir")
  public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> getFollowState(
    Authentication authentication,
    @PathVariable UUID targetUserId
  ) {
    FollowDto.FollowStateResponse response = socialFollowService.getFollowState(authentication.getName(), targetUserId);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/following")
  @Operation(summary = "Takip edilenleri getir")
  public ResponseEntity<ApiResponse<PageResponse<FollowDto.FollowResponse>>> getFollowing(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
  ) {
    PageResponse<FollowDto.FollowResponse> response = socialFollowService.getFollowing(
      authentication.getName(),
      PageRequest.of(page, size, Sort.by("createdAt").descending())
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/followers")
  @Operation(summary = "Takipcileri getir")
  public ResponseEntity<ApiResponse<PageResponse<FollowDto.FollowResponse>>> getFollowers(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
  ) {
    PageResponse<FollowDto.FollowResponse> response = socialFollowService.getFollowers(
      authentication.getName(),
      PageRequest.of(page, size, Sort.by("createdAt").descending())
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/stats")
  @Operation(summary = "Takip istatistiklerini getir")
  public ResponseEntity<ApiResponse<FollowDto.StatsResponse>> getStats(Authentication authentication) {
    FollowDto.StatsResponse response = socialFollowService.getStats(authentication.getName());
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/discover")
  @Operation(summary = "Kesfedilecek kullanicilari getir")
  public ResponseEntity<ApiResponse<PageResponse<FollowDto.DiscoverUserResponse>>> getDiscoverUsers(
    Authentication authentication,
    @RequestParam(required = false) String q,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
  ) {
    PageResponse<FollowDto.DiscoverUserResponse> response = socialFollowService.getDiscoverUsers(
      authentication.getName(),
      q,
      PageRequest.of(page, size, Sort.by("createdAt").descending())
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PostMapping("/requests/{requesterUserId}/accept")
  @Operation(summary = "Takip istegini kabul et")
  public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> acceptRequest(
    Authentication authentication,
    @PathVariable UUID requesterUserId
  ) {
    FollowDto.FollowStateResponse response = socialFollowService.acceptFollowRequest(authentication.getName(), requesterUserId);
    return ResponseEntity.ok(ApiResponse.ok(response, "Takip istegi kabul edildi"));
  }

  @PostMapping("/requests/{requesterUserId}/reject")
  @Operation(summary = "Takip istegini reddet")
  public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> rejectRequest(
    Authentication authentication,
    @PathVariable UUID requesterUserId
  ) {
    FollowDto.FollowStateResponse response = socialFollowService.rejectFollowRequest(authentication.getName(), requesterUserId);
    return ResponseEntity.ok(ApiResponse.ok(response, "Takip istegi reddedildi"));
  }

  @PostMapping("/requests/{targetUserId}/withdraw")
  @Operation(summary = "Takip istegini geri cek")
  public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> withdrawRequest(
    Authentication authentication,
    @PathVariable UUID targetUserId
  ) {
    FollowDto.FollowStateResponse response = socialFollowService.withdrawFollowRequest(authentication.getName(), targetUserId);
    return ResponseEntity.ok(ApiResponse.ok(response, "Takip istegi geri cekildi"));
  }

  @GetMapping("/requests/incoming")
  @Operation(summary = "Gelen takip isteklerini getir")
  public ResponseEntity<ApiResponse<PageResponse<FollowDto.FollowRequestResponse>>> getIncomingRequests(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
  ) {
    PageResponse<FollowDto.FollowRequestResponse> response = socialFollowService.getIncomingRequests(
      authentication.getName(),
      PageRequest.of(page, size, Sort.by("createdAt").descending())
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/requests/outgoing")
  @Operation(summary = "Gonderilen takip isteklerini getir")
  public ResponseEntity<ApiResponse<PageResponse<FollowDto.FollowRequestResponse>>> getOutgoingRequests(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
  ) {
    PageResponse<FollowDto.FollowRequestResponse> response = socialFollowService.getOutgoingRequests(
      authentication.getName(),
      PageRequest.of(page, size, Sort.by("createdAt").descending())
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/requests/stats")
  @Operation(summary = "Takip istegi istatistiklerini getir")
  public ResponseEntity<ApiResponse<FollowDto.RequestStatsResponse>> getRequestStats(Authentication authentication) {
    FollowDto.RequestStatsResponse response = socialFollowService.getRequestStats(authentication.getName());
    return ResponseEntity.ok(ApiResponse.ok(response));
  }
}


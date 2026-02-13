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

@Validated
@RestController
@RequestMapping("/v1/social/follows")
public class SocialFollowController {

    private final SocialFollowService socialFollowService;

    public SocialFollowController(SocialFollowService socialFollowService) {
        this.socialFollowService = socialFollowService;
    }

    @PostMapping("/{targetUserId}")
    public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> followUser(
        Authentication authentication,
        @PathVariable UUID targetUserId
    ) {
        FollowDto.FollowStateResponse response = socialFollowService.followUser(authentication.getName(), targetUserId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Takip edildi"));
    }

    @DeleteMapping("/{targetUserId}")
    public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> unfollowUser(
        Authentication authentication,
        @PathVariable UUID targetUserId
    ) {
        FollowDto.FollowStateResponse response = socialFollowService.unfollowUser(authentication.getName(), targetUserId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Takip birakildi"));
    }

    @GetMapping("/state/{targetUserId}")
    public ResponseEntity<ApiResponse<FollowDto.FollowStateResponse>> getFollowState(
        Authentication authentication,
        @PathVariable UUID targetUserId
    ) {
        FollowDto.FollowStateResponse response = socialFollowService.getFollowState(authentication.getName(), targetUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/following")
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
    public ResponseEntity<ApiResponse<FollowDto.StatsResponse>> getStats(Authentication authentication) {
        FollowDto.StatsResponse response = socialFollowService.getStats(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}

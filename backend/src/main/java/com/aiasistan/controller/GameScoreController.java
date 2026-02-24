/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.util.Map;
import java.util.UUID;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import com.aiasistan.common.ApiQueryUtils;
import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.GameScoreDto;
import com.aiasistan.service.GameAIService;
import com.aiasistan.service.GameScoreService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/v1/games/scores")
public class GameScoreController {
  private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("playedAt", "score", "durationSec", "gameKey");

  private final GameScoreService gameScoreService;
  private final GameAIService gameAIService;

  public GameScoreController(GameScoreService gameScoreService, GameAIService gameAIService) {
    this.gameScoreService = gameScoreService;
    this.gameAIService = gameAIService;
  }

  @PostMapping
  @Operation(summary = "Puan olustur", requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(schema = @Schema(implementation = GameScoreDto.Request.class), examples = @ExampleObject(value = """
      {
       "gameType": "memory",
       "score": 1200,
       "level": 3,
       "duration": 95
      }
      """))))
  public ResponseEntity<ApiResponse<GameScoreDto.Response>> createScore(
      Authentication authentication,
      @Valid @RequestBody GameScoreDto.Request request) {
    GameScoreDto.Response response = gameScoreService.createScore(authentication.getName(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.ok(response, "Skor kaydedildi"));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Benim puanlar listele")
  public ResponseEntity<ApiResponse<GameScoreDto.Response>> getScoreById(
      Authentication authentication,
      @PathVariable UUID id) {
    GameScoreDto.Response response = gameScoreService.getScoreById(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/me")
  @Operation(summary = "Benim puanlar listele")
  public ResponseEntity<ApiResponse<PageResponse<GameScoreDto.Response>>> getMyScores(
      Authentication authentication,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
      @RequestParam(defaultValue = "playedAt") String sortBy,
      @RequestParam(defaultValue = "DESC") String sortDirection) {
    var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "playedAt");
    PageResponse<GameScoreDto.Response> response = gameScoreService.getMyScores(
        authentication.getName(),
        PageRequest.of(page, size, sort));
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/leaderboard")
  @Operation(summary = "Liderlik tablosu getir")
  public ResponseEntity<ApiResponse<PageResponse<GameScoreDto.Response>>> getLeaderboard(
      @RequestParam String gameKey,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    PageResponse<GameScoreDto.Response> response = gameScoreService.getLeaderboard(
        gameKey,
        PageRequest.of(page, size));
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/leaderboard/following")
  @Operation(summary = "Takip edilen liderlik tablosu getir")
  public ResponseEntity<ApiResponse<PageResponse<GameScoreDto.FollowingLeaderboardResponse>>> getFollowingLeaderboard(
      Authentication authentication,
      @RequestParam String gameKey,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
    PageResponse<GameScoreDto.FollowingLeaderboardResponse> response = gameScoreService.getFollowingLeaderboard(
        authentication.getName(),
        gameKey,
        PageRequest.of(page, size));
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/rank-summary")
  @Operation(summary = "Siralama ozet getir")
  public ResponseEntity<ApiResponse<GameScoreDto.RankSummaryResponse>> getRankSummary(
      Authentication authentication,
      @RequestParam String gameKey) {
    GameScoreDto.RankSummaryResponse response = gameScoreService.getRankSummary(authentication.getName(), gameKey);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Puan sil")
  public ResponseEntity<ApiResponse<Void>> deleteScore(
      Authentication authentication,
      @PathVariable UUID id) {
    gameScoreService.deleteScore(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Skor silindi"));
  }

  // ─── AI Endpoint'leri ───

  @GetMapping("/ai/player-segment")
  @Operation(summary = "Oyuncu segmentasyonu (K-Means AI)")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getPlayerSegment(
      Authentication authentication,
      @RequestParam String gameKey) {
    Map<String, Object> result = gameAIService.getPlayerSegment(authentication.getName(), gameKey);
    return ResponseEntity.ok(ApiResponse.ok(result));
  }

  @GetMapping("/ai/performance-trend")
  @Operation(summary = "Performans trendi (Linear Regression AI)")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getPerformanceTrend(
      Authentication authentication,
      @RequestParam String gameKey) {
    Map<String, Object> result = gameAIService.getPerformanceTrend(authentication.getName(), gameKey);
    return ResponseEntity.ok(ApiResponse.ok(result));
  }
}

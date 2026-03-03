/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.util.UUID;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import com.aiasistan.common.ApiQueryUtils;
import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.GoalDto;
import com.aiasistan.service.GoalService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import io.swagger.v3.oas.annotations.Operation;

@Validated
@RestController
@RequestMapping("/v1/goals")
public class GoalController {
  private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("updatedAt", "createdAt", "targetDate", "progressPct");

  private final GoalService goalService;

  public GoalController(GoalService goalService) {
    this.goalService = goalService;
  }

  @PostMapping
  @Operation(summary = "Hedef olustur")
  public ResponseEntity<ApiResponse<GoalDto.Response>> createGoal(
      Authentication authentication,
      @Valid @RequestBody GoalDto.Request request) {
    GoalDto.Response response = goalService.createGoal(authentication.getName(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.ok(response, "Hedef olusturuldu"));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Hedefler listele")
  public ResponseEntity<ApiResponse<GoalDto.Response>> getGoalById(
      Authentication authentication,
      @PathVariable UUID id) {
    GoalDto.Response response = goalService.getGoalById(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping
  @Operation(summary = "Hedefler listele")
  public ResponseEntity<ApiResponse<PageResponse<GoalDto.Response>>> getGoals(
      Authentication authentication,
      @RequestParam(required = false) Boolean completed,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
      @RequestParam(defaultValue = "updatedAt") String sortBy,
      @RequestParam(defaultValue = "DESC") String sortDirection) {
    var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "updatedAt");
    PageResponse<GoalDto.Response> response = goalService.getGoals(
        authentication.getName(),
        completed,
        PageRequest.of(page, size, sort));
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PutMapping("/{id}")
  @Operation(summary = "Hedef guncelle")
  public ResponseEntity<ApiResponse<GoalDto.Response>> updateGoal(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody GoalDto.Request request) {
    GoalDto.Response response = goalService.updateGoal(authentication.getName(), id, request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Hedef guncellendi"));
  }

  @PatchMapping("/{id}/progress")
  @Operation(summary = "İlerleme guncelle")
  public ResponseEntity<ApiResponse<GoalDto.Response>> updateProgress(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody GoalDto.ProgressRequest request) {
    GoalDto.Response response = goalService.updateProgress(authentication.getName(), id, request.getProgressPct());
    return ResponseEntity.ok(ApiResponse.ok(response, "Ilerleme guncellendi"));
  }

  @PatchMapping("/{id}/completion")
  @Operation(summary = "Tamamlanma guncelle")
  public ResponseEntity<ApiResponse<GoalDto.Response>> updateCompletion(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody GoalDto.CompletionRequest request) {
    GoalDto.Response response = goalService.updateCompletion(authentication.getName(), id, request.getIsCompleted());
    return ResponseEntity.ok(ApiResponse.ok(response, "Tamamlanma durumu guncellendi"));
  }

  @PostMapping("/{id}/motivation")
  @Operation(summary = "Hedef icin AI motivasyon mesaji al")
  public ResponseEntity<ApiResponse<GoalDto.MotivationResponse>> getMotivation(
      Authentication authentication,
      @PathVariable UUID id) {
    GoalDto.MotivationResponse response = goalService.getGoalMotivation(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response, "Motivasyon mesaji olusturuldu"));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Hedef sil")
  public ResponseEntity<ApiResponse<Void>> deleteGoal(
      Authentication authentication,
      @PathVariable UUID id) {
    goalService.deleteGoal(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Hedef silindi"));
  }
}

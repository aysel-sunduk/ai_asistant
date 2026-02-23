/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.HealthGoalDto;
import com.aiasistan.service.HealthGoalService;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;

@Validated
@RestController
@RequestMapping("/v1/health/goals")
public class HealthGoalController {

  private final HealthGoalService healthGoalService;

  public HealthGoalController(HealthGoalService healthGoalService) {
    this.healthGoalService = healthGoalService;
  }

  @GetMapping
  @Operation(summary = "Hedefler listele")
  public ResponseEntity<ApiResponse<HealthGoalDto.Response>> getGoals(Authentication authentication) {
    HealthGoalDto.Response response = healthGoalService.getOrCreateGoals(authentication.getName());
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PutMapping
  @Operation(summary = "Hedefler guncelle")
  public ResponseEntity<ApiResponse<HealthGoalDto.Response>> updateGoals(
    Authentication authentication,
    @Valid @RequestBody HealthGoalDto.Request request
  ) {
    HealthGoalDto.Response response = healthGoalService.upsertGoals(authentication.getName(), request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Saglik hedefleri guncellendi"));
  }
}

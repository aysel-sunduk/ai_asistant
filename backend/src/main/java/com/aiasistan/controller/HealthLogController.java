/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiQueryUtils;
import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.HealthLogDto;
import com.aiasistan.service.HealthLogService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/v1/health/logs")
public class HealthLogController {
  private static final Logger log = LoggerFactory.getLogger(HealthLogController.class);
  private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("loggedAt", "logDate", "logType", "source");

  private final HealthLogService healthLogService;

  public HealthLogController(HealthLogService healthLogService) {
    this.healthLogService = healthLogService;
  }

  @PostMapping
  @Operation(summary = "Saglik kaydi olustur")
  public ResponseEntity<ApiResponse<HealthLogDto.Response>> createLog(
      Authentication authentication,
      @Valid @RequestBody HealthLogDto.Request request) {
    // Log minimal incoming payload to help diagnose empty syncs
    log.info("createLog request: user={}, externalRecordId={}, logType={}, source={}, logDate={}",
        authentication.getName(), request.getExternalRecordId(), request.getLogType(), request.getSource(),
        request.getLogDate());
    HealthLogDto.Response response = healthLogService.createLog(authentication.getName(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.ok(response, "Saglik kaydi olusturuldu"));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Saglik kaydi detayini getir")
  public ResponseEntity<ApiResponse<HealthLogDto.Response>> getLogById(
      Authentication authentication,
      @PathVariable UUID id) {
    HealthLogDto.Response response = healthLogService.getLogById(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping
  @Operation(summary = "Saglik kayitlarini listele")
  public ResponseEntity<ApiResponse<PageResponse<HealthLogDto.Response>>> getLogs(
      Authentication authentication,
      @RequestParam(defaultValue = "0") @Min(0) int page,
      @RequestParam(defaultValue = "20") @Min(1) @Max(value = 200, message = "Sayfa boyutu en fazla 200 olabilir") int size,
      @RequestParam(defaultValue = "loggedAt") String sortBy,
      @RequestParam(defaultValue = "DESC") String sortDirection) {
    var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "loggedAt");
    PageResponse<HealthLogDto.Response> response = healthLogService.getLogs(
        authentication.getName(),
        PageRequest.of(page, size, sort));
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/date-range")
  @Operation(summary = "Tarih araligina gore saglik kayitlarini getir")
  public ResponseEntity<ApiResponse<List<HealthLogDto.Response>>> getLogsByDateRange(
      Authentication authentication,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
      @RequestParam(required = false) String logType) {
    List<HealthLogDto.Response> response = healthLogService.getLogsByDateRange(
        authentication.getName(),
        startDate,
        endDate,
        logType);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/daily-nutrition")
  @Operation(summary = "Gunluk toplam besin (kalori, makro) degerlerini getir")
  public ResponseEntity<ApiResponse<com.aiasistan.dto.response.DailyNutritionResponse>> getDailyNutrition(
      Authentication authentication,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return ResponseEntity.ok(ApiResponse.ok(healthLogService.getDailyNutrition(authentication.getName(), date)));
  }

  @PutMapping("/{id}")
  @Operation(summary = "Saglik kaydini guncelle")
  public ResponseEntity<ApiResponse<HealthLogDto.Response>> updateLog(
      Authentication authentication,
      @PathVariable UUID id,
      @Valid @RequestBody HealthLogDto.Request request) {
    HealthLogDto.Response response = healthLogService.updateLog(authentication.getName(), id, request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Saglik kaydi guncellendi"));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Saglik kaydini sil")
  public ResponseEntity<ApiResponse<Void>> deleteLog(
      Authentication authentication,
      @PathVariable UUID id) {
    healthLogService.deleteLog(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Saglik kaydi silindi"));
  }
}

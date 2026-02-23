/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
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

import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.ReminderDto;
import com.aiasistan.service.ReminderService;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/business/reminders")
public class ReminderController {

  private final ReminderService reminderService;

  public ReminderController(ReminderService reminderService) {
    this.reminderService = reminderService;
  }

  @PostMapping
  @Operation(
    summary = "Hatirlatici olustur",
    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
      required = true,
      content = @Content(schema = @Schema(implementation = ReminderDto.Request.class))
    )
  )
  public ResponseEntity<ApiResponse<ReminderDto.Response>> createReminder(
    Authentication authentication,
    @Valid @RequestBody ReminderDto.Request request
  ) {
    ReminderDto.Response response = reminderService.createReminder(authentication.getName(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(ApiResponse.ok(response, "Hatirlatici basariyla olusturuldu"));
  }

  @GetMapping("/{id}")
    @Operation(summary = "Hatirlatici detayini getir")
  public ResponseEntity<ApiResponse<ReminderDto.Response>> getReminderById(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    ReminderDto.Response response = reminderService.getReminderById(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping
    @Operation(summary = "Tum hatirlaticilari listele")
  public ResponseEntity<ApiResponse<PageResponse<ReminderDto.Response>>> getAllReminders(
    Authentication authentication,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "remindAt") String sortBy,
    @RequestParam(defaultValue = "ASC") String sortDirection
  ) {
    Sort sort = sortDirection.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
    PageResponse<ReminderDto.Response> response = reminderService.getAllReminders(authentication.getName(), PageRequest.of(page, size, sort));
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/scheduled")
    @Operation(summary = "Planli hatirlaticilari getir")
  public ResponseEntity<ApiResponse<List<ReminderDto.Response>>> getScheduledReminders(Authentication authentication) {
    List<ReminderDto.Response> response = reminderService.getScheduledReminders(authentication.getName());
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/notifications")
    @Operation(summary = "Bildirim akisindaki kayitlari getir")
  public ResponseEntity<ApiResponse<List<ReminderDto.Response>>> getNotificationFeed(
    Authentication authentication,
    @RequestParam(defaultValue = "1440") int withinMinutes
  ) {
    List<ReminderDto.Response> response = reminderService.getNotificationFeed(authentication.getName(), withinMinutes);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/date-range")
    @Operation(summary = "Tarih araligina gore hatirlaticilari getir")
  public ResponseEntity<ApiResponse<List<ReminderDto.Response>>> getRemindersByDateRange(
    Authentication authentication,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
  ) {
    List<ReminderDto.Response> response = reminderService.getRemindersByDateRange(authentication.getName(), startDate, endDate);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PutMapping("/{id}")
  @Operation(
    summary = "Hatirlatici guncelle",
    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
      required = true,
      content = @Content(schema = @Schema(implementation = ReminderDto.Request.class))
    )
  )
  public ResponseEntity<ApiResponse<ReminderDto.Response>> updateReminder(
    Authentication authentication,
    @PathVariable UUID id,
    @Valid @RequestBody ReminderDto.Request request
  ) {
    ReminderDto.Response response = reminderService.updateReminder(authentication.getName(), id, request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Hatirlatici basariyla guncellendi"));
  }

  @PatchMapping("/{id}/status")
    @Operation(summary = "Hatirlatici durumunu guncelle")
  public ResponseEntity<ApiResponse<ReminderDto.Response>> updateReminderStatus(
    Authentication authentication,
    @PathVariable UUID id,
    @Parameter(
      description = "Kabul edilen degerler: scheduled, sent, skipped, canceled",
      example = "scheduled"
    )
    @RequestParam String status
  ) {
    ReminderDto.Response response = reminderService.updateReminderStatus(authentication.getName(), id, status);
    return ResponseEntity.ok(ApiResponse.ok(response, "Hatirlatici durumu guncellendi"));
  }

  @PatchMapping("/notifications/{id}/dismiss")
  @Operation(summary = "Bildirim kapat")
  public ResponseEntity<ApiResponse<ReminderDto.Response>> dismissNotification(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    ReminderDto.Response response = reminderService.dismissNotification(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response, "Bildirim temizlendi"));
  }

  @PatchMapping("/notifications/clear-all")
    @Operation(summary = "Tum bildirimleri temizle")
  public ResponseEntity<ApiResponse<Void>> clearNotifications(
    Authentication authentication,
    @RequestParam(defaultValue = "1440") int withinMinutes
  ) {
    int cleared = reminderService.clearNotifications(authentication.getName(), withinMinutes);
    return ResponseEntity.ok(ApiResponse.ok(null, "Temizlenen bildirim: " + cleared));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Hatirlatici sil")
  public ResponseEntity<ApiResponse<Void>> deleteReminder(Authentication authentication, @PathVariable UUID id) {
    reminderService.deleteReminder(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Hatirlatici basariyla silindi"));
  }
}

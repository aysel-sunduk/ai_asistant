/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
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

import com.aiasistan.common.ApiQueryUtils;
import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.WorkEventDto;
import com.aiasistan.service.WorkEventService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/v1/business/events")
@Tag(name = "Is Etkinlikleri", description = "Toplanti ve is etkinlikleri yonetimi")
public class WorkEventController {
  
  private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
    "startTime", "endTime", "createdAt", "updatedAt", "title", "priority", "status"
  );

  private final WorkEventService workEventService;

  public WorkEventController(WorkEventService workEventService) {
    this.workEventService = workEventService;
  }

  @PostMapping
  @Operation(
    summary = "Is etkinligi olustur",
    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
      required = true,
      content = @Content(schema = @Schema(implementation = WorkEventDto.Request.class))
    )
  )
  public ResponseEntity<ApiResponse<WorkEventDto.Response>> createWorkEvent(
    Authentication authentication,
    @Valid @RequestBody WorkEventDto.Request request
  ) {
    WorkEventDto.Response response = workEventService.createWorkEvent(
      authentication.getName(), request
    );
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(ApiResponse.ok(response, "Toplanti basariyla olusturuldu"));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Etkinlik detayini getir")
  public ResponseEntity<ApiResponse<WorkEventDto.Response>> getWorkEventById(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    WorkEventDto.Response response = workEventService.getWorkEventById(
      authentication.getName(), id
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping
  @Operation(summary = "Tum etkinlikleri listele")
  public ResponseEntity<ApiResponse<PageResponse<WorkEventDto.Response>>> getAllWorkEvents(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
    @RequestParam(defaultValue = "startTime") String sortBy,
    @RequestParam(defaultValue = "ASC") String sortDirection
  ) {
    var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "startTime");
    PageResponse<WorkEventDto.Response> response = workEventService.getAllWorkEvents(
      authentication.getName(),
      PageRequest.of(page, size, sort)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/date-range")
  @Operation(summary = "Tarih araligina gore etkinlikleri getir")
  public ResponseEntity<ApiResponse<List<WorkEventDto.Response>>> getEventsByDateRange(
    Authentication authentication,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate
  ) {
    List<WorkEventDto.Response> response = workEventService.getEventsByDateRange(
      authentication.getName(), startDate, endDate
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/upcoming")
  @Operation(summary = "Yaklasan etkinlikleri getir")
  public ResponseEntity<ApiResponse<List<WorkEventDto.Response>>> getUpcomingEvents(
    Authentication authentication
  ) {
    List<WorkEventDto.Response> response = workEventService.getUpcomingEvents(
      authentication.getName()
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Yaklasan toplantilar getirildi"));
  }

  @GetMapping("/ongoing")
  @Operation(summary = "Devam eden etkinlikleri getir")
  public ResponseEntity<ApiResponse<List<WorkEventDto.Response>>> getOngoingEvents(
    Authentication authentication
  ) {
    List<WorkEventDto.Response> response = workEventService.getOngoingEvents(
      authentication.getName()
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Devam eden toplantilar getirildi"));
  }

  @GetMapping("/today")
  @Operation(summary = "Bugunun etkinliklerini getir")
  public ResponseEntity<ApiResponse<List<WorkEventDto.Response>>> getTodayEvents(
    Authentication authentication
  ) {
    List<WorkEventDto.Response> response = workEventService.getTodayEvents(
      authentication.getName()
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Bugunun toplantilari getirildi"));
  }

  @GetMapping("/this-week")
  @Operation(summary = "Bu haftaki etkinlikleri getir")
  public ResponseEntity<ApiResponse<List<WorkEventDto.Response>>> getThisWeekEvents(
    Authentication authentication
  ) {
    List<WorkEventDto.Response> response = workEventService.getThisWeekEvents(
      authentication.getName()
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Bu haftanin toplantilari getirildi"));
  }

  @GetMapping("/by-status")
  @Operation(summary = "Duruma gore etkinlikleri getir")
  public ResponseEntity<ApiResponse<PageResponse<WorkEventDto.Response>>> getEventsByStatus(
    Authentication authentication,
    @RequestParam String status,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
  ) {
    PageResponse<WorkEventDto.Response> response = workEventService.getEventsByStatus(
      authentication.getName(),
      status,
      PageRequest.of(page, size)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/by-priority")
  @Operation(summary = "Oncelige gore etkinlikleri getir")
  public ResponseEntity<ApiResponse<List<WorkEventDto.Response>>> getEventsByPriority(
    Authentication authentication,
    @RequestParam String priority
  ) {
    List<WorkEventDto.Response> response = workEventService.getEventsByPriority(
      authentication.getName(), priority
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/by-type")
  @Operation(summary = "Ture gore etkinlikleri getir")
  public ResponseEntity<ApiResponse<PageResponse<WorkEventDto.Response>>> getEventsByType(
    Authentication authentication,
    @RequestParam String eventType,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
  ) {
    PageResponse<WorkEventDto.Response> response = workEventService.getEventsByType(
      authentication.getName(),
      eventType,
      PageRequest.of(page, size)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/online")
  @Operation(summary = "Cevrimici etkinlikleri getir")
  public ResponseEntity<ApiResponse<PageResponse<WorkEventDto.Response>>> getOnlineEvents(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
  ) {
    PageResponse<WorkEventDto.Response> response = workEventService.getOnlineEvents(
      authentication.getName(),
      PageRequest.of(page, size)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/past")
  @Operation(summary = "Gecmis etkinlikleri getir")
  public ResponseEntity<ApiResponse<PageResponse<WorkEventDto.Response>>> getPastEvents(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
  ) {
    PageResponse<WorkEventDto.Response> response = workEventService.getPastEvents(
      authentication.getName(),
      PageRequest.of(page, size)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/search")
  @Operation(summary = "Etkinlikler ara")
  public ResponseEntity<ApiResponse<PageResponse<WorkEventDto.Response>>> searchEvents(
    Authentication authentication,
    @RequestParam String query,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size
  ) {
    PageResponse<WorkEventDto.Response> response = workEventService.searchEvents(
      authentication.getName(),
      query,
      PageRequest.of(page, size)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/summary")
  @Operation(summary = "Etkinlik ozetini getir")
  public ResponseEntity<ApiResponse<WorkEventDto.Summary>> getEventsSummary(
    Authentication authentication
  ) {
    WorkEventDto.Summary response = workEventService.getEventsSummary(
      authentication.getName()
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Toplanti ozeti getirildi"));
  }

  @PutMapping("/{id}")
  @Operation(
    summary = "Etkinligi guncelle",
    requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
      required = true,
      content = @Content(schema = @Schema(implementation = WorkEventDto.Request.class))
    )
  )
  public ResponseEntity<ApiResponse<WorkEventDto.Response>> updateWorkEvent(
    Authentication authentication,
    @PathVariable UUID id,
    @Valid @RequestBody WorkEventDto.Request request
  ) {
    WorkEventDto.Response response = workEventService.updateWorkEvent(
      authentication.getName(), id, request
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Toplanti basariyla guncellendi"));
  }

  @PatchMapping("/{id}/status")
  @Operation(summary = "Etkinlik durumunu guncelle")
  public ResponseEntity<ApiResponse<WorkEventDto.Response>> updateEventStatus(
    Authentication authentication,
    @PathVariable UUID id,
    @RequestParam String status
  ) {
    WorkEventDto.Response response = workEventService.updateEventStatus(
      authentication.getName(), id, status
    );
    return ResponseEntity.ok(ApiResponse.ok(response, "Toplanti durumu guncellendi"));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Etkinligi sil")
  public ResponseEntity<ApiResponse<Void>> deleteWorkEvent(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    workEventService.deleteWorkEvent(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Toplanti basariyla silindi"));
  }
}

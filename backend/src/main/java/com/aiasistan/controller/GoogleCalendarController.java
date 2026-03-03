package com.aiasistan.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.GoogleCalendarDto;
import com.aiasistan.service.GoogleCalendarService;

import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/v1/integrations/google-calendar")
public class GoogleCalendarController {

    private final GoogleCalendarService googleCalendarService;

    public GoogleCalendarController(GoogleCalendarService googleCalendarService) {
        this.googleCalendarService = googleCalendarService;
    }

    @GetMapping("/auth-url")
    public ResponseEntity<ApiResponse<GoogleCalendarDto.AuthUrlResponse>> getAuthUrl(
            Authentication authentication,
            @RequestParam String redirectUri) {
        GoogleCalendarDto.AuthUrlResponse response = googleCalendarService.buildAuthUrl(authentication.getName(),
                redirectUri);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<GoogleCalendarDto.StatusResponse>> connect(
            Authentication authentication,
            @Valid @RequestBody GoogleCalendarDto.ConnectRequest request) {
        GoogleCalendarDto.StatusResponse response = googleCalendarService.connect(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Google Calendar baglantisi kuruldu"));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<GoogleCalendarDto.StatusResponse>> status(Authentication authentication) {
        GoogleCalendarDto.StatusResponse response = googleCalendarService.getStatus(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/calendars")
    public ResponseEntity<ApiResponse<java.util.List<GoogleCalendarDto.CalendarItem>>> listCalendars(Authentication authentication) {
        java.util.List<GoogleCalendarDto.CalendarItem> response = googleCalendarService.listCalendars(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/selected-calendar")
    public ResponseEntity<ApiResponse<GoogleCalendarDto.SelectCalendarResponse>> selectCalendar(
            Authentication authentication,
            @Valid @RequestBody GoogleCalendarDto.SelectCalendarRequest request) {
        GoogleCalendarDto.SelectCalendarResponse response = googleCalendarService.selectCalendar(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Google Calendar secimi guncellendi"));
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<ApiResponse<Void>> disconnect(Authentication authentication) {
        googleCalendarService.disconnect(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(null, "Google Calendar baglantisi kaldirildi"));
    }

    @PostMapping("/resync")
    public ResponseEntity<ApiResponse<java.util.Map<String, Integer>>> resync(Authentication authentication) {
        int synced = googleCalendarService.resyncAll(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(java.util.Map.of("synced", synced), "Google Calendar yeniden senkronize edildi"));
    }
}

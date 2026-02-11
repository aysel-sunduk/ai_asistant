package com.aiasistan.controller;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.BusinessDashboardDto;
import com.aiasistan.service.BusinessDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/business/dashboard")
public class BusinessDashboardController {

    private final BusinessDashboardService dashboardService;

    public BusinessDashboardController(BusinessDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<BusinessDashboardDto.Statistics>> getStatistics(Authentication authentication) {
        BusinessDashboardDto.Statistics statistics = dashboardService.getStatistics(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(statistics));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<BusinessDashboardDto.TodaySummary>> getTodaySummary(Authentication authentication) {
        BusinessDashboardDto.TodaySummary summary = dashboardService.getTodaySummary(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<BusinessDashboardDto.WeeklyOverview>> getWeeklyOverview(Authentication authentication) {
        BusinessDashboardDto.WeeklyOverview overview = dashboardService.getWeeklyOverview(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(overview));
    }
}

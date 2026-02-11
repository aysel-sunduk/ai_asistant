package com.aiasistan.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.CurrencyRateRequest;
import com.aiasistan.dto.request.InvestmentRequest;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.dto.response.InvestmentPerformanceResponse;
import com.aiasistan.dto.response.InvestmentResponse;
import com.aiasistan.service.CurrencyService;
import com.aiasistan.service.InvestmentService;
import com.aiasistan.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/finance")
@Tag(name = "Finance", description = "Finance management APIs")
public class FinanceController {
    
    private final CurrencyService currencyService;
    private final InvestmentService investmentService;
    private final UserService userService;
    
    // Manuel constructor
    public FinanceController(
        CurrencyService currencyService,
        InvestmentService investmentService,
        UserService userService
    ) {
        this.currencyService = currencyService;
        this.investmentService = investmentService;
        this.userService = userService;
    }
    
    // ============ CURRENCY ENDPOINTS ============
    
    @PostMapping("/currencies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Save currency rate (Admin only)")
    public ResponseEntity<ApiResponse<CurrencyRateResponse>> saveCurrencyRate(
            @Valid @RequestBody CurrencyRateRequest request) {
        CurrencyRateResponse response = currencyService.saveCurrencyRate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Currency rate saved successfully"));
    }
    
    @GetMapping("/currencies/latest/{code}")
    @Operation(summary = "Get latest currency rate by code")
    public ResponseEntity<ApiResponse<CurrencyRateResponse>> getLatestRate(
            @PathVariable String code) {
        CurrencyRateResponse response = currencyService.getLatestRate(code);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
    
    @GetMapping("/currencies/historical/{code}")
    @Operation(summary = "Get historical currency rates")
    public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getHistoricalRates(
            @PathVariable String code,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<CurrencyRateResponse> response = currencyService.getHistoricalRates(code, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
    
    @GetMapping("/currencies")
    @Operation(summary = "Get all currency rates with pagination")
    public ResponseEntity<ApiResponse<Page<CurrencyRateResponse>>> getAllRates(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<CurrencyRateResponse> response = currencyService.getAllRates(pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/currencies/live")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Fetch live rates from external API and save them (Admin only)")
    public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> fetchAndSaveLiveRates(
            @RequestParam(defaultValue = "USD") String base) {
        List<CurrencyRateResponse> response = currencyService.fetchAndSaveLiveRates(base);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Live rates fetched and saved"));
    }
    
    // ============ INVESTMENT ENDPOINTS ============
    
    @PostMapping("/investments")
    @Operation(summary = "Add new investment")
    public ResponseEntity<ApiResponse<InvestmentResponse>> addInvestment(
            Authentication authentication,
            @Valid @RequestBody InvestmentRequest request) {
        UUID userId = resolveUserId(authentication);
        InvestmentResponse response = investmentService.addInvestment(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Investment added successfully"));
    }
    
    @PutMapping("/investments/{id}/price")
    @Operation(summary = "Update investment average cost")
    public ResponseEntity<ApiResponse<InvestmentResponse>> updateInvestmentPrice(
            @PathVariable UUID id,
            Authentication authentication,
            @RequestParam Long avgCostMinor) {
        UUID userId = resolveUserId(authentication);
        InvestmentResponse response = investmentService.updateInvestmentPrice(id, userId, avgCostMinor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Investment price updated"));
    }
    
    @GetMapping("/investments")
    @Operation(summary = "Get user investments")
    public ResponseEntity<ApiResponse<Page<InvestmentResponse>>> getUserInvestments(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = resolveUserId(authentication);
        Page<InvestmentResponse> response = investmentService.getUserInvestments(userId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
    
    @GetMapping("/investments/{id}")
    @Operation(summary = "Get investment by id")
    public ResponseEntity<ApiResponse<InvestmentResponse>> getInvestment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        InvestmentResponse response = investmentService.getInvestment(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
    
    @DeleteMapping("/investments/{id}")
    @Operation(summary = "Delete investment")
    public ResponseEntity<ApiResponse<Void>> deleteInvestment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        investmentService.deleteInvestment(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Investment deleted successfully"));
    }
    
    @GetMapping("/investments/total")
    @Operation(summary = "Get total investment value")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalInvestment(
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        BigDecimal total = investmentService.getTotalInvestment(userId);
        return ResponseEntity.ok(ApiResponse.ok(total));
    }

    @GetMapping("/investments/performance")
    @Operation(summary = "Get portfolio performance metrics")
    public ResponseEntity<ApiResponse<InvestmentPerformanceResponse>> getPortfolioPerformance(
            Authentication authentication) {
        UUID userId = resolveUserId(authentication);
        InvestmentPerformanceResponse response = investmentService.getPortfolioPerformance(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private UUID resolveUserId(Authentication authentication) {
        String email = authentication.getName();
        return userService.getUserIdByEmail(email);
    }
}

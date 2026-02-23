/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest; // Manuel Pageable iÃ§in ÅŸart
import org.springframework.data.domain.Sort;    // Manuel Pageable iÃ§in ÅŸart
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.request.CurrencyHoldingRequest;
import com.aiasistan.dto.request.FavoriteCurrencyRequest;
import com.aiasistan.dto.request.FavoriteInvestmentRequest;
import com.aiasistan.dto.request.InvestmentRequest;
import com.aiasistan.dto.request.PopularCurrencyRequest;
import com.aiasistan.dto.response.CurrencyHoldingResponse;
import com.aiasistan.dto.response.CurrencyHoldingSummaryResponse;
import com.aiasistan.dto.response.CurrencyPairDailyDetailResponse;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.dto.response.FinanceDashboardResponse;
import com.aiasistan.dto.response.FinanceMetalSymbolResponse;
import com.aiasistan.dto.response.InvestmentPerformanceResponse;
import com.aiasistan.dto.response.InvestmentResponse;
import com.aiasistan.service.CurrencyService;
import com.aiasistan.service.FinanceMarketService;
import com.aiasistan.service.FinanceMetalSymbolService;
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
  private final FinanceMarketService financeMarketService;
  private final FinanceMetalSymbolService financeMetalSymbolService;
  private final InvestmentService investmentService;
  private final UserService userService;
  
  public FinanceController(
    CurrencyService currencyService,
    FinanceMarketService financeMarketService,
    FinanceMetalSymbolService financeMetalSymbolService,
    InvestmentService investmentService,
    UserService userService
  ) {
    this.currencyService = currencyService;
    this.financeMarketService = financeMarketService;
    this.financeMetalSymbolService = financeMetalSymbolService;
    this.investmentService = investmentService;
    this.userService = userService;
  }
  
  // ============ CURRENCY ENDPOINTS ============
  
  @GetMapping("/currencies/latest/{code}")
  @Operation(summary = "Guncel anlik kur getir")
  public ResponseEntity<ApiResponse<CurrencyRateResponse>> getLatestLiveRate(
      @PathVariable String code,
      @RequestParam(defaultValue = "TRY") String base) {
    CurrencyRateResponse response = currencyService.getLiveRate(base, code);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/currencies/supported")
  @Operation(summary = "Desteklenen dovizleri getir")
  public ResponseEntity<ApiResponse<List<String>>> getSupportedCurrencies() {
    return ResponseEntity.ok(ApiResponse.ok(currencyService.getSupportedCurrencies()));
  }

  @GetMapping("/currencies/live")
  @Operation(summary = "Temel para birimine gore anlik kurlari getir")
  public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getLiveRatesByBase(
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(required = false) List<String> symbols) {
    List<CurrencyRateResponse> response = currencyService.getLiveRates(base, symbols);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/currencies/history/{code}")
  @Operation(summary = "Doviz gecmis getir")
  public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getCurrencyHistory(
      @PathVariable String code,
      @RequestParam(required = false) String base,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
    List<CurrencyRateResponse> response = currencyService.getHistoricalRates(code, base, startDate, endDate);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/metals/live")
  @Operation(summary = "Anlik metal kurlarini getir")
  public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getLiveMetalRates(
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(required = false) List<String> symbols) {
    List<String> requestedSymbols = (symbols == null || symbols.isEmpty())
      ? financeMetalSymbolService.getActiveSymbolResponses().stream().map(FinanceMetalSymbolResponse::getCode).toList()
      : symbols;
    List<CurrencyRateResponse> response = currencyService.getLiveRates(base, requestedSymbols);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/metals/symbols")
  @Operation(summary = "Metal sembollerini getir")
  public ResponseEntity<ApiResponse<List<FinanceMetalSymbolResponse>>> getMetalSymbols() {
    return ResponseEntity.ok(ApiResponse.ok(financeMetalSymbolService.getActiveSymbolResponses()));
  }

  @GetMapping("/currencies/details")
  @Operation(summary = "Doviz parite detaylarini getir")
  public ResponseEntity<ApiResponse<CurrencyPairDailyDetailResponse>> getCurrencyPairDetails(
      @RequestParam String base,
      @RequestParam String quote) {
    CurrencyPairDailyDetailResponse response = currencyService.getCurrencyPairDailyDetail(base, quote);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/currencies/popular")
  @Operation(summary = "Populer doviz kurlarini getir")
  public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getPopularRates(
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh) {
    List<CurrencyRateResponse> response = financeMarketService.getPopularRates(base, refresh);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PostMapping("/currencies/popular")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Populer doviz ekle veya guncelle")
  public ResponseEntity<ApiResponse<Void>> upsertPopularCurrency(
      @Valid @RequestBody PopularCurrencyRequest request) {
    financeMarketService.upsertPopularCurrency(request);
    return ResponseEntity.ok(ApiResponse.ok(null, "Popular currency updated"));
  }

  @DeleteMapping("/currencies/popular/{code}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Populer doviz sil")
  public ResponseEntity<ApiResponse<Void>> removePopularCurrency(
      @PathVariable String code) {
    financeMarketService.removePopularCurrency(code);
    return ResponseEntity.ok(ApiResponse.ok(null, "Popular currency removed"));
  }

  @GetMapping("/currencies/favorites")
  @Operation(summary = "Favori doviz kurlarini getir")
  public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getFavoriteRates(
      Authentication authentication,
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh) {
    UUID userId = resolveUserId(authentication);
    List<CurrencyRateResponse> response = financeMarketService.getFavoriteRates(userId, base, refresh);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PostMapping("/currencies/favorites")
  @Operation(summary = "Favori doviz ekle veya guncelle")
  public ResponseEntity<ApiResponse<Void>> upsertFavoriteCurrency(
      Authentication authentication,
      @Valid @RequestBody FavoriteCurrencyRequest request) {
    UUID userId = resolveUserId(authentication);
    financeMarketService.upsertFavoriteCurrency(userId, request);
    return ResponseEntity.ok(ApiResponse.ok(null, "Favorite currency updated"));
  }

  @DeleteMapping("/currencies/favorites/{code}")
  @Operation(summary = "Favori doviz sil")
  public ResponseEntity<ApiResponse<Void>> removeFavoriteCurrency(
      Authentication authentication,
      @PathVariable String code) {
    UUID userId = resolveUserId(authentication);
    financeMarketService.removeFavoriteCurrency(userId, code);
    return ResponseEntity.ok(ApiResponse.ok(null, "Favorite currency removed"));
  }
  
  // ============ INVESTMENT ENDPOINTS ============
  
  @PostMapping("/investments")
  @Operation(summary = "Yatirim ekle")
  public ResponseEntity<ApiResponse<InvestmentResponse>> addInvestment(
      Authentication authentication,
      @Valid @RequestBody InvestmentRequest request) {
    UUID userId = resolveUserId(authentication);
    InvestmentResponse response = investmentService.addInvestment(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(ApiResponse.ok(response, "Investment added successfully"));
  }
  
  @PutMapping("/investments/{id}/price")
  @Operation(summary = "Yatirim ortalama maliyetini guncelle")
  public ResponseEntity<ApiResponse<InvestmentResponse>> updateInvestmentPrice(
      @PathVariable UUID id,
      Authentication authentication,
      @RequestParam Long avgCostMinor) {
    UUID userId = resolveUserId(authentication);
    InvestmentResponse response = investmentService.updateInvestmentPrice(id, userId, avgCostMinor);
    return ResponseEntity.ok(ApiResponse.ok(response, "Investment price updated"));
  }
  
  @GetMapping("/investments")
  @Operation(summary = "Yatirimlari sayfali getir")
  public ResponseEntity<ApiResponse<PageResponse<InvestmentResponse>>> getUserInvestments(
      Authentication authentication,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "updatedAt") String sortBy,
      @RequestParam(defaultValue = "DESC") String sortDirection) {
    
    UUID userId = resolveUserId(authentication);
    Sort sort = sortDirection.equalsIgnoreCase("ASC") 
          ? Sort.by(sortBy).ascending() 
          : Sort.by(sortBy).descending();
    
    PageRequest pageRequest = PageRequest.of(page, size, sort);
    PageResponse<InvestmentResponse> response = investmentService.getUserInvestments(userId, pageRequest);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }
  
  @GetMapping("/investments/{id}")
  @Operation(summary = "Yatirim detayini getir")
  public ResponseEntity<ApiResponse<InvestmentResponse>> getInvestment(
      @PathVariable UUID id,
      Authentication authentication) {
    UUID userId = resolveUserId(authentication);
    InvestmentResponse response = investmentService.getInvestment(id, userId);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/investments/favorites")
  @Operation(summary = "Favori yatirimlari getir")
  public ResponseEntity<ApiResponse<List<InvestmentResponse>>> getFavoriteInvestments(
      Authentication authentication) {
    UUID userId = resolveUserId(authentication);
    List<InvestmentResponse> response = investmentService.getFavoriteInvestments(userId);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PostMapping("/investments/favorites")
  @Operation(summary = "Favori yatirimi ekle veya guncelle")
  public ResponseEntity<ApiResponse<Void>> upsertFavoriteInvestment(
      Authentication authentication,
      @Valid @RequestBody FavoriteInvestmentRequest request) {
    UUID userId = resolveUserId(authentication);
    investmentService.upsertFavoriteInvestment(userId, request);
    return ResponseEntity.ok(ApiResponse.ok(null, "Favorite investment updated"));
  }

  @DeleteMapping("/investments/favorites/{investmentId}")
  @Operation(summary = "Favori yatirimi sil")
  public ResponseEntity<ApiResponse<Void>> removeFavoriteInvestment(
      Authentication authentication,
      @PathVariable UUID investmentId) {
    UUID userId = resolveUserId(authentication);
    investmentService.removeFavoriteInvestment(userId, investmentId);
    return ResponseEntity.ok(ApiResponse.ok(null, "Favorite investment removed"));
  }
  
  @DeleteMapping("/investments/{id}")
  @Operation(summary = "Yatirimi sil")
  public ResponseEntity<ApiResponse<Void>> deleteInvestment(
      @PathVariable UUID id,
      Authentication authentication) {
    UUID userId = resolveUserId(authentication);
    investmentService.deleteInvestment(id, userId);
    return ResponseEntity.ok(ApiResponse.ok(null, "Investment deleted successfully"));
  }
  
  @GetMapping("/investments/total")
  @Operation(summary = "Toplam yatirim tutarini getir")
  public ResponseEntity<ApiResponse<BigDecimal>> getTotalInvestment(
      Authentication authentication) {
    UUID userId = resolveUserId(authentication);
    BigDecimal total = investmentService.getTotalInvestment(userId);
    return ResponseEntity.ok(ApiResponse.ok(total));
  }

  @GetMapping("/investments/performance")
  @Operation(summary = "Portfoy performansini getir")
  public ResponseEntity<ApiResponse<InvestmentPerformanceResponse>> getPortfolioPerformance(
      Authentication authentication) {
    UUID userId = resolveUserId(authentication);
    InvestmentPerformanceResponse response = investmentService.getPortfolioPerformance(userId);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PostMapping("/currency-holdings")
  @Operation(summary = "Doviz varlik ekle")
  public ResponseEntity<ApiResponse<CurrencyHoldingResponse>> addCurrencyHolding(
      Authentication authentication,
      @Valid @RequestBody CurrencyHoldingRequest request,
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh) {
    UUID userId = resolveUserId(authentication);
    CurrencyHoldingResponse response = financeMarketService.addCurrencyHolding(userId, request, base, refresh);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(ApiResponse.ok(response, "Currency holding added"));
  }

  @PutMapping("/currency-holdings/{id}")
  @Operation(summary = "Doviz varlik guncelle")
  public ResponseEntity<ApiResponse<CurrencyHoldingResponse>> updateCurrencyHolding(
      @PathVariable UUID id,
      Authentication authentication,
      @Valid @RequestBody CurrencyHoldingRequest request,
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh) {
    UUID userId = resolveUserId(authentication);
    CurrencyHoldingResponse response = financeMarketService.updateCurrencyHolding(userId, id, request, base, refresh);
    return ResponseEntity.ok(ApiResponse.ok(response, "Currency holding updated"));
  }

  @GetMapping("/currency-holdings")
  @Operation(summary = "Doviz varliklarini getir")
  public ResponseEntity<ApiResponse<PageResponse<CurrencyHoldingResponse>>> getCurrencyHoldings(
      Authentication authentication,
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "updatedAt") String sortBy,
      @RequestParam(defaultValue = "DESC") String sortDirection) {
    UUID userId = resolveUserId(authentication);
    Sort sort = sortDirection.equalsIgnoreCase("ASC")
      ? Sort.by(sortBy).ascending()
      : Sort.by(sortBy).descending();
    PageRequest pageRequest = PageRequest.of(page, size, sort);
    PageResponse<CurrencyHoldingResponse> response = financeMarketService.getCurrencyHoldings(userId, pageRequest, base, refresh);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @DeleteMapping("/currency-holdings/{id}")
  @Operation(summary = "Doviz varlik sil")
  public ResponseEntity<ApiResponse<Void>> deleteCurrencyHolding(
      @PathVariable UUID id,
      Authentication authentication) {
    UUID userId = resolveUserId(authentication);
    financeMarketService.deleteCurrencyHolding(userId, id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Currency holding deleted"));
  }

  @GetMapping("/currency-holdings/summary")
  @Operation(summary = "Doviz varlik ozetini getir")
  public ResponseEntity<ApiResponse<CurrencyHoldingSummaryResponse>> getCurrencyHoldingSummary(
      Authentication authentication,
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh) {
    UUID userId = resolveUserId(authentication);
    CurrencyHoldingSummaryResponse response = financeMarketService.getCurrencyHoldingSummary(userId, base, refresh);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/dashboard")
  @Operation(summary = "Panel getir")
  public ResponseEntity<ApiResponse<FinanceDashboardResponse>> getDashboard(
      Authentication authentication,
      @RequestParam(defaultValue = "TRY") String base,
      @RequestParam(defaultValue = "true") boolean refresh,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    UUID userId = resolveUserId(authentication);
    PageRequest pageRequest = PageRequest.of(page, size, Sort.by("updatedAt").descending());
    FinanceDashboardResponse response = financeMarketService.getDashboard(userId, base, refresh, pageRequest);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  private UUID resolveUserId(Authentication authentication) {
    String email = authentication.getName();
    return userService.getUserIdByEmail(email);
  }
}

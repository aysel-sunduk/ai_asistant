package com.aiasistan.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import com.aiasistan.dto.request.FamilyBirthdayRequest;
import com.aiasistan.dto.request.FamilyTransactionRequest;
import com.aiasistan.dto.response.CurrencyRateResponse;
import com.aiasistan.dto.response.FamilyBirthdayResponse;
import com.aiasistan.dto.response.FamilyFinanceSummaryResponse;
import com.aiasistan.dto.response.FamilyTransactionResponse;
import com.aiasistan.service.FamilyService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/family")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<FamilyTransactionResponse>> createTransaction(
        Authentication authentication,
        @Valid @RequestBody FamilyTransactionRequest request
    ) {
        FamilyTransactionResponse response = familyService.createTransaction(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Transaction created"));
    }

@GetMapping("/transactions")
public ResponseEntity<ApiResponse<Page<FamilyTransactionResponse>>> getTransactions(
        Authentication authentication,
        @ParameterObject Pageable pageable
) {
    Page<FamilyTransactionResponse> response =
            familyService.getTransactions(authentication.getName(), pageable);

    return ResponseEntity.ok(ApiResponse.ok(response));
}


    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<FamilyTransactionResponse>> getTransaction(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(familyService.getTransaction(authentication.getName(), id)));
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<FamilyTransactionResponse>> updateTransaction(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody FamilyTransactionRequest request
    ) {
        FamilyTransactionResponse response = familyService.updateTransaction(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Transaction updated"));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        familyService.deleteTransaction(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Transaction deleted"));
    }

    @GetMapping("/transactions/summary")
    public ResponseEntity<ApiResponse<FamilyFinanceSummaryResponse>> getSummary(
        Authentication authentication,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        FamilyFinanceSummaryResponse response = familyService.getFinanceSummary(authentication.getName(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/birthdays")
    public ResponseEntity<ApiResponse<FamilyBirthdayResponse>> createBirthday(
        Authentication authentication,
        @Valid @RequestBody FamilyBirthdayRequest request
    ) {
        FamilyBirthdayResponse response = familyService.createBirthday(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Birthday created"));
    }

   @GetMapping("/birthdays")
public ResponseEntity<ApiResponse<Page<FamilyBirthdayResponse>>> getBirthdays(
        Authentication authentication,
        @ParameterObject @PageableDefault(size = 20) Pageable pageable
) {
    Page<FamilyBirthdayResponse> response =
            familyService.getBirthdays(authentication.getName(), pageable);

    return ResponseEntity.ok(ApiResponse.ok(response));
}


    @GetMapping("/birthdays/{id}")
    public ResponseEntity<ApiResponse<FamilyBirthdayResponse>> getBirthday(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(familyService.getBirthday(authentication.getName(), id)));
    }

    @PutMapping("/birthdays/{id}")
    public ResponseEntity<ApiResponse<FamilyBirthdayResponse>> updateBirthday(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody FamilyBirthdayRequest request
    ) {
        FamilyBirthdayResponse response = familyService.updateBirthday(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Birthday updated"));
    }

    @DeleteMapping("/birthdays/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBirthday(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        familyService.deleteBirthday(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Birthday deleted"));
    }

    @GetMapping("/birthdays/upcoming")
    public ResponseEntity<ApiResponse<List<FamilyBirthdayResponse>>> getUpcomingBirthdays(
        Authentication authentication,
        @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(ApiResponse.ok(familyService.getUpcomingBirthdays(authentication.getName(), days)));
    }

    @GetMapping("/fx/latest/{code}")
    public ResponseEntity<ApiResponse<CurrencyRateResponse>> getLatestFx(
        @PathVariable String code
    ) {
        return ResponseEntity.ok(ApiResponse.ok(familyService.getLatestFxRate(code)));
    }

    @GetMapping("/fx/historical/{code}")
    public ResponseEntity<ApiResponse<List<CurrencyRateResponse>>> getHistoricalFx(
        @PathVariable String code,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        return ResponseEntity.ok(ApiResponse.ok(familyService.getHistoricalFxRates(code, startDate, endDate)));
    }
}

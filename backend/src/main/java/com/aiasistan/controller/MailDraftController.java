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
import com.aiasistan.dto.MailDraftDto;
import com.aiasistan.service.MailDraftService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/v1/business/mail-drafts")
public class MailDraftController {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("updatedAt", "createdAt", "subject", "status");

    private final MailDraftService mailDraftService;

    public MailDraftController(MailDraftService mailDraftService) {
        this.mailDraftService = mailDraftService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MailDraftDto.Response>> createDraft(
        Authentication authentication,
        @Valid @RequestBody MailDraftDto.Request request
    ) {
        MailDraftDto.Response response = mailDraftService.createDraft(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Mail taslagi olusturuldu"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MailDraftDto.Response>> getDraftById(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        MailDraftDto.Response response = mailDraftService.getDraftById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MailDraftDto.Response>>> getDrafts(
        Authentication authentication,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "updatedAt") String sortBy,
        @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "updatedAt");
        PageResponse<MailDraftDto.Response> response = mailDraftService.getDrafts(
            authentication.getName(),
            PageRequest.of(page, size, sort)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MailDraftDto.Response>> updateDraft(
        Authentication authentication,
        @PathVariable UUID id,
        @Valid @RequestBody MailDraftDto.Request request
    ) {
        MailDraftDto.Response response = mailDraftService.updateDraft(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Mail taslagi guncellendi"));
    }

    @PatchMapping("/{id}/regenerate")
    public ResponseEntity<ApiResponse<MailDraftDto.Response>> regenerateDraft(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        MailDraftDto.Response response = mailDraftService.regenerateDraft(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Mail taslagi yeniden uretildi"));
    }

    @PostMapping("/generate-preview")
    public ResponseEntity<ApiResponse<MailDraftDto.GenerateResponse>> generatePreview(
        @Valid @RequestBody MailDraftDto.GenerateRequest request
    ) {
        MailDraftDto.GenerateResponse response = mailDraftService.generatePreview(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(
        Authentication authentication,
        @PathVariable UUID id
    ) {
        mailDraftService.deleteDraft(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Mail taslagi silindi"));
    }
}

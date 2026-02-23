/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import com.aiasistan.common.ApiResponse;
import com.aiasistan.dto.request.ContactRequest;
import com.aiasistan.dto.response.ContactResponse;
import com.aiasistan.service.ContactService;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/v1/family/contacts")
public class ContactController {

  private final ContactService contactService;

  public ContactController(ContactService contactService) {
    this.contactService = contactService;
  }

  @PostMapping
  @Operation(summary = "Kisi olustur")
  public ResponseEntity<ApiResponse<ContactResponse>> createContact(
    Authentication authentication,
    @Valid @RequestBody ContactRequest request
  ) {
    ContactResponse response = contactService.createContact(authentication.getName(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Contact created"));
  }

  @GetMapping
  @Operation(summary = "Kisiler listele")
  public ResponseEntity<ApiResponse<Page<ContactResponse>>> getContacts(
    Authentication authentication,
    @ParameterObject @PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable
  ) {
    Page<ContactResponse> response = contactService.getContacts(authentication.getName(), pageable);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Kisi getir")
  public ResponseEntity<ApiResponse<ContactResponse>> getContact(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    return ResponseEntity.ok(ApiResponse.ok(contactService.getContact(authentication.getName(), id)));
  }

  @PutMapping("/{id}")
  @Operation(summary = "Kisi guncelle")
  public ResponseEntity<ApiResponse<ContactResponse>> updateContact(
    Authentication authentication,
    @PathVariable UUID id,
    @Valid @RequestBody ContactRequest request
  ) {
    ContactResponse response = contactService.updateContact(authentication.getName(), id, request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Contact updated"));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Kisi sil")
  public ResponseEntity<ApiResponse<Void>> deleteContact(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    contactService.deleteContact(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Contact deleted"));
  }
}

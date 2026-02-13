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
import com.aiasistan.dto.ShoppingItemDto;
import com.aiasistan.dto.ShoppingListDto;
import com.aiasistan.service.ShoppingService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Validated
@RestController
@RequestMapping("/v1/shopping")
public class ShoppingController {
    private static final Set<String> LIST_SORT_FIELDS = Set.of("createdAt", "name", "isArchived");
    private static final Set<String> ITEM_SORT_FIELDS = Set.of("name", "quantity", "estimatedPriceMinor", "isChecked");

    private final ShoppingService shoppingService;

    public ShoppingController(ShoppingService shoppingService) {
        this.shoppingService = shoppingService;
    }

    @PostMapping("/lists")
    public ResponseEntity<ApiResponse<ShoppingListDto.Response>> createList(
        Authentication authentication,
        @Valid @RequestBody ShoppingListDto.Request request
    ) {
        ShoppingListDto.Response response = shoppingService.createList(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Alisveris listesi olusturuldu"));
    }

    @GetMapping("/lists")
    public ResponseEntity<ApiResponse<PageResponse<ShoppingListDto.Response>>> getLists(
        Authentication authentication,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, LIST_SORT_FIELDS, "createdAt");
        PageResponse<ShoppingListDto.Response> response = shoppingService.getLists(
            authentication.getName(),
            PageRequest.of(page, size, sort)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/lists/{listId}")
    public ResponseEntity<ApiResponse<ShoppingListDto.Response>> getListById(
        Authentication authentication,
        @PathVariable UUID listId
    ) {
        ShoppingListDto.Response response = shoppingService.getListById(authentication.getName(), listId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/lists/{listId}")
    public ResponseEntity<ApiResponse<ShoppingListDto.Response>> updateList(
        Authentication authentication,
        @PathVariable UUID listId,
        @Valid @RequestBody ShoppingListDto.Request request
    ) {
        ShoppingListDto.Response response = shoppingService.updateList(authentication.getName(), listId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Alisveris listesi guncellendi"));
    }

    @DeleteMapping("/lists/{listId}")
    public ResponseEntity<ApiResponse<Void>> deleteList(
        Authentication authentication,
        @PathVariable UUID listId
    ) {
        shoppingService.deleteList(authentication.getName(), listId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Alisveris listesi silindi"));
    }

    @PostMapping("/lists/{listId}/items")
    public ResponseEntity<ApiResponse<ShoppingItemDto.Response>> createItem(
        Authentication authentication,
        @PathVariable UUID listId,
        @Valid @RequestBody ShoppingItemDto.Request request
    ) {
        ShoppingItemDto.Response response = shoppingService.createItem(authentication.getName(), listId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok(response, "Alisveris urunu eklendi"));
    }

    @GetMapping("/lists/{listId}/items")
    public ResponseEntity<ApiResponse<PageResponse<ShoppingItemDto.Response>>> getItems(
        Authentication authentication,
        @PathVariable UUID listId,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
        @RequestParam(defaultValue = "name") String sortBy,
        @RequestParam(defaultValue = "ASC") String sortDirection
    ) {
        var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ITEM_SORT_FIELDS, "name");
        PageResponse<ShoppingItemDto.Response> response = shoppingService.getItems(
            authentication.getName(),
            listId,
            PageRequest.of(page, size, sort)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/lists/{listId}/items/{itemId}")
    public ResponseEntity<ApiResponse<ShoppingItemDto.Response>> getItemById(
        Authentication authentication,
        @PathVariable UUID listId,
        @PathVariable UUID itemId
    ) {
        ShoppingItemDto.Response response = shoppingService.getItemById(authentication.getName(), listId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/lists/{listId}/items/{itemId}")
    public ResponseEntity<ApiResponse<ShoppingItemDto.Response>> updateItem(
        Authentication authentication,
        @PathVariable UUID listId,
        @PathVariable UUID itemId,
        @Valid @RequestBody ShoppingItemDto.Request request
    ) {
        ShoppingItemDto.Response response = shoppingService.updateItem(authentication.getName(), listId, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Alisveris urunu guncellendi"));
    }

    @PatchMapping("/lists/{listId}/items/{itemId}/check")
    public ResponseEntity<ApiResponse<ShoppingItemDto.Response>> updateItemCheck(
        Authentication authentication,
        @PathVariable UUID listId,
        @PathVariable UUID itemId,
        @Valid @RequestBody ShoppingItemDto.CheckRequest request
    ) {
        ShoppingItemDto.Response response = shoppingService.updateItemCheck(
            authentication.getName(),
            listId,
            itemId,
            request.getChecked()
        );
        return ResponseEntity.ok(ApiResponse.ok(response, "Urun isaret durumu guncellendi"));
    }

    @DeleteMapping("/lists/{listId}/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
        Authentication authentication,
        @PathVariable UUID listId,
        @PathVariable UUID itemId
    ) {
        shoppingService.deleteItem(authentication.getName(), listId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Alisveris urunu silindi"));
    }
}

/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.ShoppingItemDto;
import com.aiasistan.dto.ShoppingListDto;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.FamilyTransaction;
import com.aiasistan.model.ShoppingItem;
import com.aiasistan.model.ShoppingList;
import com.aiasistan.repository.FamilyTransactionRepository;
import com.aiasistan.repository.ShoppingItemRepository;
import com.aiasistan.repository.ShoppingListRepository;

@Service
public class ShoppingService {
    private static final Set<String> ALLOWED_RECURRENCE_TYPES = Set.of("DAILY", "WEEKLY", "MONTHLY");

    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingItemRepository shoppingItemRepository;
    private final FamilyTransactionRepository familyTransactionRepository;
    private final UserService userService;

    public ShoppingService(
        ShoppingListRepository shoppingListRepository,
        ShoppingItemRepository shoppingItemRepository,
        FamilyTransactionRepository familyTransactionRepository,
        UserService userService
    ) {
        this.shoppingListRepository = shoppingListRepository;
        this.shoppingItemRepository = shoppingItemRepository;
        this.familyTransactionRepository = familyTransactionRepository;
        this.userService = userService;
    }

    @Transactional
    public ShoppingListDto.Response createList(String userEmail, ShoppingListDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        ShoppingList list = new ShoppingList();
        list.setUserId(userId);
        list.setName(request.getName().trim());
        list.setIsArchived(Boolean.TRUE.equals(request.getIsArchived()));
        list.setRecurrenceType(resolveRecurrenceType(request.getRecurrenceType()));

        return ShoppingListDto.Response.from(shoppingListRepository.save(list));
    }

    @Transactional(readOnly = true)
    public PageResponse<ShoppingListDto.Response> getLists(String userEmail, Boolean archived, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<ShoppingListDto.Response> page = (archived == null
            ? shoppingListRepository.findByUserId(userId, pageable)
            : shoppingListRepository.findByUserIdAndIsArchived(userId, archived, pageable))
            .map(ShoppingListDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public ShoppingListDto.Response getListById(String userEmail, UUID listId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ShoppingList list = findOwnedList(userId, listId);
        return ShoppingListDto.Response.from(list);
    }

    @Transactional
    public ShoppingListDto.Response updateList(String userEmail, UUID listId, ShoppingListDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ShoppingList list = findOwnedList(userId, listId);

        list.setName(request.getName().trim());
        if (request.getIsArchived() != null) {
            list.setIsArchived(request.getIsArchived());
        }
        if (request.getRecurrenceType() != null) {
            list.setRecurrenceType(resolveRecurrenceType(request.getRecurrenceType()));
        }

        return ShoppingListDto.Response.from(shoppingListRepository.save(list));
    }

    @Transactional
    public void deleteList(String userEmail, UUID listId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ShoppingList list = findOwnedList(userId, listId);
        for (ShoppingItem item : shoppingItemRepository.findByList_Id(listId, Pageable.unpaged()).getContent()) {
            deleteOrphanedShoppingExpense(userId, item.getId());
            item.setDeletedAt(OffsetDateTime.now());
            shoppingItemRepository.save(item);
        }
        list.setDeletedAt(OffsetDateTime.now());
        list.setIsArchived(true);
        shoppingListRepository.save(list);
    }

    @Transactional
    public ShoppingItemDto.Response createItem(String userEmail, UUID listId, ShoppingItemDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ShoppingList list = findOwnedList(userId, listId);

        ShoppingItem item = new ShoppingItem();
        item.setList(list);
        applyItemRequest(item, request);
        ShoppingItem saved = shoppingItemRepository.save(item);
        syncShoppingExpense(userId, saved);
        return ShoppingItemDto.Response.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ShoppingItemDto.Response> getItems(String userEmail, UUID listId, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        findOwnedList(userId, listId);

        Page<ShoppingItemDto.Response> page = shoppingItemRepository.findByList_Id(listId, pageable)
            .map(ShoppingItemDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public ShoppingItemDto.Response getItemById(String userEmail, UUID listId, UUID itemId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        findOwnedList(userId, listId);

        ShoppingItem item = findItemInList(listId, itemId);
        return ShoppingItemDto.Response.from(item);
    }

    @Transactional(readOnly = true)
    public ShoppingItemDto.Response getItemById(String userEmail, UUID itemId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ShoppingItem item = shoppingItemRepository.findByIdAndList_UserId(itemId, userId)
            .orElseThrow(() -> new NotFoundException("Alisveris urunu bulunamadi"));
        return ShoppingItemDto.Response.from(item);
    }

    @Transactional
    public ShoppingItemDto.Response updateItem(String userEmail, UUID listId, UUID itemId, ShoppingItemDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        findOwnedList(userId, listId);

        ShoppingItem item = findItemInList(listId, itemId);
        applyItemRequest(item, request);
        ShoppingItem saved = shoppingItemRepository.save(item);
        syncShoppingExpense(userId, saved);
        return ShoppingItemDto.Response.from(saved);
    }

    @Transactional
    public ShoppingItemDto.Response updateItemCheck(String userEmail, UUID listId, UUID itemId, Boolean checked) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        findOwnedList(userId, listId);

        ShoppingItem item = findItemInList(listId, itemId);
        item.setIsChecked(Boolean.TRUE.equals(checked));
        item.setCheckedAt(Boolean.TRUE.equals(checked) ? OffsetDateTime.now() : null);
        ShoppingItem saved = shoppingItemRepository.save(item);
        syncShoppingExpense(userId, saved);
        return ShoppingItemDto.Response.from(saved);
    }

    @Transactional
    public void deleteItem(String userEmail, UUID listId, UUID itemId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        findOwnedList(userId, listId);

        ShoppingItem item = findItemInList(listId, itemId);
        deleteOrphanedShoppingExpense(userId, itemId);
        item.setDeletedAt(OffsetDateTime.now());
        shoppingItemRepository.save(item);
    }

    @Transactional
    public ShoppingListDto.Response updateListArchive(String userEmail, UUID listId, Boolean archived) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        ShoppingList list = findOwnedList(userId, listId);
        list.setIsArchived(Boolean.TRUE.equals(archived));
        return ShoppingListDto.Response.from(shoppingListRepository.save(list));
    }

    @Transactional(readOnly = true)
    public ShoppingListDto.SummaryResponse getListSummary(String userEmail, UUID listId) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        findOwnedList(userId, listId);

        Long totalEstimatedPriceMinor = shoppingItemRepository.sumEstimatedPriceMinorByListId(listId);
        Long totalCheckedPriceMinor = shoppingItemRepository.sumCheckedEstimatedPriceMinorByListId(listId);
        Long totalItemCount = shoppingItemRepository.countByList_Id(listId);
        Long checkedItemCount = shoppingItemRepository.countByList_IdAndIsCheckedTrue(listId);

        return new ShoppingListDto.SummaryResponse(
            totalEstimatedPriceMinor,
            totalCheckedPriceMinor,
            totalItemCount,
            checkedItemCount
        );
    }

    private ShoppingList findOwnedList(UUID userId, UUID listId) {
        return shoppingListRepository.findByIdAndUserId(listId, userId)
            .orElseThrow(() -> new NotFoundException("Alisveris listesi bulunamadi"));
    }

    private ShoppingItem findItemInList(UUID listId, UUID itemId) {
        return shoppingItemRepository.findByIdAndList_Id(itemId, listId)
            .orElseThrow(() -> new NotFoundException("Alisveris urunu bulunamadi"));
    }

    private void applyItemRequest(ShoppingItem item, ShoppingItemDto.Request request) {
        String normalizedName = request.getName().trim();
        item.setName(normalizedName);
        item.setProductKey(normalizeProductKey(normalizedName));
        item.setCategory(normalizeNullableText(request.getCategory()));
        item.setQuantity(request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1);
        item.setUnit(normalizeNullableText(request.getUnit()));
        item.setEstimatedPriceMinor(request.getEstimatedPriceMinor());
        Boolean checked = request.getIsChecked() != null ? request.getIsChecked() : Boolean.FALSE;
        item.setIsChecked(checked);
        item.setCheckedAt(Boolean.TRUE.equals(checked) ? OffsetDateTime.now() : null);
        item.setNote(request.getNote());
    }

    private void syncShoppingExpense(UUID userId, ShoppingItem item) {
        String noteKey = shoppingExpenseNote(item.getId());
        Long estimated = item.getEstimatedPriceMinor();

        // Sadece kullanıcı gerçekten satın aldıysa (check=true) gider kaydı oluştur.
        if (!Boolean.TRUE.equals(item.getIsChecked()) || estimated == null || estimated <= 0) {
            deleteOrphanedShoppingExpense(userId, item.getId());
            return;
        }

        FamilyTransaction tx = familyTransactionRepository.findByUserIdAndNote(userId, noteKey)
            .orElseGet(FamilyTransaction::new);

        tx.setUserId(userId);
        tx.setType("EXPENSE");
        tx.setAmountMinor(estimated);
        tx.setCurrency("TRY");
        tx.setCategory("shopping");
        tx.setOccurredOn(LocalDate.now());
        tx.setNote(noteKey);
        familyTransactionRepository.save(tx);
    }

    private void deleteOrphanedShoppingExpense(UUID userId, UUID itemId) {
        familyTransactionRepository.findByUserIdAndNote(userId, shoppingExpenseNote(itemId))
            .ifPresent(familyTransactionRepository::delete);
    }

    private String shoppingExpenseNote(UUID itemId) {
        return "shopping_item:" + itemId;
    }

    private String resolveRecurrenceType(String recurrenceType) {
        if (recurrenceType == null || recurrenceType.isBlank()) {
            return "WEEKLY";
        }
        String normalized = recurrenceType.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_RECURRENCE_TYPES.contains(normalized)) {
            return "WEEKLY";
        }
        return normalized;
    }

    @Transactional
    public void setupTestItems(String userEmail) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        
        // Test Listesi
        ShoppingList list = new ShoppingList();
        list.setUserId(userId);
        list.setName("Test Alisveris");
        list.setRecurrenceType("WEEKLY");
        ShoppingList savedList = shoppingListRepository.save(list);
        
        // 14 gün önce alınan Yumurta
        ShoppingItem item1 = new ShoppingItem();
        item1.setList(savedList);
        item1.setName("Yumurta");
        item1.setProductKey("yumurta");
        item1.setIsChecked(true);
        item1.setCheckedAt(OffsetDateTime.now().minusDays(14));
        item1.setQuantity(1);
        shoppingItemRepository.save(item1);
        
        // 7 gün önce alınan Yumurta (7 gün aralık)
        ShoppingItem item2 = new ShoppingItem();
        item2.setList(savedList);
        item2.setName("Yumurta");
        item2.setProductKey("yumurta");
        item2.setIsChecked(true);
        item2.setCheckedAt(OffsetDateTime.now().minusDays(7));
        item2.setQuantity(1);
        shoppingItemRepository.save(item2);
    }

    private String normalizeProductKey(String name) {
        return name.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

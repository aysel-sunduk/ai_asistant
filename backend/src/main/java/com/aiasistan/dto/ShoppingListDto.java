/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import com.aiasistan.model.ShoppingList;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO: Alışveriş listesi verilerini taşır.
 */
public class ShoppingListDto {

    public static class Request {
        @NotBlank(message = "Liste adi bos olamaz")
        @Size(min = 2, max = 80, message = "Liste adi 2-80 karakter arasinda olmali")
        private String name;

        private Boolean isArchived;

        @Pattern(
            regexp = "^(?i)(DAILY|WEEKLY|MONTHLY)$",
            message = "recurrenceType sadece DAILY, WEEKLY veya MONTHLY olabilir"
        )
        private String recurrenceType;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Boolean getIsArchived() {
            return isArchived;
        }

        public void setIsArchived(Boolean isArchived) {
            this.isArchived = isArchived;
        }

        public String getRecurrenceType() {
            return recurrenceType;
        }

        public void setRecurrenceType(String recurrenceType) {
            this.recurrenceType = recurrenceType;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String name;
        private Boolean isArchived;
        private String recurrenceType;
        private OffsetDateTime createdAt;

        public static Response from(ShoppingList list) {
            Response response = new Response();
            response.id = list.getId();
            response.userId = list.getUserId();
            response.name = list.getName();
            response.isArchived = list.getIsArchived();
            response.recurrenceType = normalizeRecurrenceType(list.getRecurrenceType());
            response.createdAt = list.getCreatedAt();
            return response;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Boolean getIsArchived() {
            return isArchived;
        }

        public void setIsArchived(Boolean isArchived) {
            this.isArchived = isArchived;
        }

        public String getRecurrenceType() {
            return recurrenceType;
        }

        public void setRecurrenceType(String recurrenceType) {
            this.recurrenceType = recurrenceType;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }

    private static String normalizeRecurrenceType(String recurrenceType) {
        if (recurrenceType == null || recurrenceType.isBlank()) {
            return "WEEKLY";
        }
        return recurrenceType.trim().toUpperCase(Locale.ROOT);
    }

    public static class ArchiveRequest {
        @NotNull(message = "Archived bilgisi zorunludur")
        private Boolean archived;

        public Boolean getArchived() {
            return archived;
        }

        public void setArchived(Boolean archived) {
            this.archived = archived;
        }
    }

    public static class SummaryResponse {
        private Long totalEstimatedPriceMinor;
        private Long totalCheckedPriceMinor;
        private Long totalItemCount;
        private Long checkedItemCount;

        public SummaryResponse(Long totalEstimatedPriceMinor, Long totalCheckedPriceMinor, Long totalItemCount, Long checkedItemCount) {
            this.totalEstimatedPriceMinor = totalEstimatedPriceMinor;
            this.totalCheckedPriceMinor = totalCheckedPriceMinor;
            this.totalItemCount = totalItemCount;
            this.checkedItemCount = checkedItemCount;
        }

        public Long getTotalEstimatedPriceMinor() {
            return totalEstimatedPriceMinor;
        }

        public void setTotalEstimatedPriceMinor(Long totalEstimatedPriceMinor) {
            this.totalEstimatedPriceMinor = totalEstimatedPriceMinor;
        }

        public Long getTotalCheckedPriceMinor() {
            return totalCheckedPriceMinor;
        }

        public void setTotalCheckedPriceMinor(Long totalCheckedPriceMinor) {
            this.totalCheckedPriceMinor = totalCheckedPriceMinor;
        }

        public Long getTotalItemCount() {
            return totalItemCount;
        }

        public void setTotalItemCount(Long totalItemCount) {
            this.totalItemCount = totalItemCount;
        }

        public Long getCheckedItemCount() {
            return checkedItemCount;
        }

        public void setCheckedItemCount(Long checkedItemCount) {
            this.checkedItemCount = checkedItemCount;
        }
    }
}

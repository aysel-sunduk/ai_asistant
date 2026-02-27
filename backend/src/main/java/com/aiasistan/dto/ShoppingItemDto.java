/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.aiasistan.model.ShoppingItem;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO: Alışveriş öğesi (item) bilgileri.
 */
public class ShoppingItemDto {

    public static class Request {
        @NotBlank(message = "Urun adi bos olamaz")
        @Size(min = 2, max = 100, message = "Urun adi 2-100 karakter arasinda olmali")
        private String name;

        @Min(value = 1, message = "Adet en az 1 olmali")
        private Integer quantity;

        private String category;
        private String unit;
        @Min(value = 0, message = "Tahmini fiyat negatif olamaz")
        private Long estimatedPriceMinor;
        private Boolean isChecked;
        private String note;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public Long getEstimatedPriceMinor() {
            return estimatedPriceMinor;
        }

        public void setEstimatedPriceMinor(Long estimatedPriceMinor) {
            this.estimatedPriceMinor = estimatedPriceMinor;
        }

        public Boolean getIsChecked() {
            return isChecked;
        }

        public void setIsChecked(Boolean isChecked) {
            this.isChecked = isChecked;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }

    public static class CheckRequest {
        @NotNull(message = "Checked bilgisi zorunludur")
        private Boolean checked;

        public Boolean getChecked() {
            return checked;
        }

        public void setChecked(Boolean checked) {
            this.checked = checked;
        }
    }

    public static class Response {
        private UUID id;
        private UUID listId;
        private String name;
        private String productKey;
        private String category;
        private Integer quantity;
        private String unit;
        private Long estimatedPriceMinor;
        private Boolean isChecked;
        private String note;
        private OffsetDateTime addedAt;
        private OffsetDateTime checkedAt;

        public static Response from(ShoppingItem item) {
            Response response = new Response();
            response.id = item.getId();
            response.listId = item.getListId();
            response.name = item.getName();
            response.productKey = item.getProductKey();
            response.category = item.getCategory();
            response.quantity = item.getQuantity();
            response.unit = item.getUnit();
            response.estimatedPriceMinor = item.getEstimatedPriceMinor();
            response.isChecked = item.getIsChecked();
            response.note = item.getNote();
            response.addedAt = item.getAddedAt();
            response.checkedAt = item.getCheckedAt();
            return response;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public UUID getListId() {
            return listId;
        }

        public void setListId(UUID listId) {
            this.listId = listId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getProductKey() {
            return productKey;
        }

        public void setProductKey(String productKey) {
            this.productKey = productKey;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }

        public Long getEstimatedPriceMinor() {
            return estimatedPriceMinor;
        }

        public void setEstimatedPriceMinor(Long estimatedPriceMinor) {
            this.estimatedPriceMinor = estimatedPriceMinor;
        }

        public Boolean getIsChecked() {
            return isChecked;
        }

        public void setIsChecked(Boolean isChecked) {
            this.isChecked = isChecked;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public OffsetDateTime getAddedAt() {
            return addedAt;
        }

        public void setAddedAt(OffsetDateTime addedAt) {
            this.addedAt = addedAt;
        }

        public OffsetDateTime getCheckedAt() {
            return checkedAt;
        }

        public void setCheckedAt(OffsetDateTime checkedAt) {
            this.checkedAt = checkedAt;
        }
    }
}

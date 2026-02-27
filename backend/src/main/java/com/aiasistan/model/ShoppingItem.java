/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "shopping_items")
public class ShoppingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "list_id", nullable = false)
    private ShoppingList list;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "product_key", nullable = false)
    private String productKey;

    @Column(name = "category")
    private String category;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "unit")
    private String unit;

    @Column(name = "estimated_price_minor")
    private Long estimatedPriceMinor;

    @Column(name = "is_checked", nullable = false)
    private Boolean isChecked = false;

    @Column(name = "note", columnDefinition = "text")
    private String note;

    @Column(name = "added_at", nullable = false, columnDefinition = "timestamptz")
    private OffsetDateTime addedAt;

    @Column(name = "checked_at", columnDefinition = "timestamptz")
    private OffsetDateTime checkedAt;

    @PrePersist
    protected void onCreate() {
        if (quantity == null || quantity < 1) {
            quantity = 1;
        }
        if (isChecked == null) {
            isChecked = false;
        }
        if (addedAt == null) {
            addedAt = OffsetDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ShoppingList getList() {
        return list;
    }

    public void setList(ShoppingList list) {
        this.list = list;
    }

    public UUID getListId() {
        return list != null ? list.getId() : null;
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

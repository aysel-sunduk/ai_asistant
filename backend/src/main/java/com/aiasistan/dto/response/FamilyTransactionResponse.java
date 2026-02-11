package com.aiasistan.dto.response;

import com.aiasistan.common.enums.FamilyTransactionType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class FamilyTransactionResponse {
    private UUID id;
    private FamilyTransactionType type;
    private Long amountMinor;
    private String currency;
    private String category;
    private LocalDate occurredOn;
    private String note;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public FamilyTransactionType getType() { return type; }
    public void setType(FamilyTransactionType type) { this.type = type; }
    public Long getAmountMinor() { return amountMinor; }
    public void setAmountMinor(Long amountMinor) { this.amountMinor = amountMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public LocalDate getOccurredOn() { return occurredOn; }
    public void setOccurredOn(LocalDate occurredOn) { this.occurredOn = occurredOn; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

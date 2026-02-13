package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public class FamilyTransactionRequest {

    @NotNull(message = "Type is required")
    private String type;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Long amountMinor;

    @NotBlank(message = "Currency is required")
    private String currency;

    private String category;

    @NotNull(message = "Occurred date is required")
    private LocalDate occurredOn;

    private String note;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
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
}

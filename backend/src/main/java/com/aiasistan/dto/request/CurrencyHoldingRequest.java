package com.aiasistan.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CurrencyHoldingRequest {

    @NotBlank(message = "Currency code is required")
    private String currencyCode;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    @NotNull(message = "Average cost is required")
    @Positive(message = "Average cost must be positive")
    private Long avgCostMinor;

    private String currency;

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public Long getAvgCostMinor() {
        return avgCostMinor;
    }

    public void setAvgCostMinor(Long avgCostMinor) {
        this.avgCostMinor = avgCostMinor;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}

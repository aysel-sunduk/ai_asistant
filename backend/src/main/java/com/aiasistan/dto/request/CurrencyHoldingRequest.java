/**
 * Data Transfer Object for creating or updating a currency holding.
 *
 * This DTO is used by controller endpoints that accept currency holding
 * information from API clients. It contains validation annotations to
 * enforce required fields and basic value constraints.
 *
 * Field notes:
 * - `currencyCode`: ISO currency code (e.g. "USD", "EUR"). Required.
 * - `quantity`: Amount of the currency held (uses {@link java.math.BigDecimal}
 *   for precision). Must be positive and is required.
 * - `avgCostMinor`: Average cost expressed in minor units (e.g. cents).
 *   Stored as `Long` to avoid floating point issues. Must be positive.
 * - `currency`: Optional human-readable currency name or localized label.
 */
package com.aiasistan.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CurrencyHoldingRequest {

    /**
     * ISO currency code (3-letter), required. Example: "USD".
     */
    @NotBlank(message = "Currency code is required")
    private String currencyCode;

    /**
     * Quantity of the holding. Use BigDecimal for financial precision.
     * Must be non-null and positive.
     */
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;

    /**
     * Average cost expressed in minor currency units (e.g. cents). Using
     * minor units as Long avoids floating point rounding issues when
     * storing monetary values.
     */
    @NotNull(message = "Average cost is required")
    @Positive(message = "Average cost must be positive")
    private Long avgCostMinor;

    /**
     * Optional human-readable currency name or localized label.
     */
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
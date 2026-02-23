/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO: Döviz kuru sorgulama isteği parametreleri.
 */
public class CurrencyRateRequest {
    
    @NotNull(message = "Currency code cannot be null")
    private String currencyCode;
    
    @NotNull(message = "Rate cannot be null")
    @Positive(message = "Rate must be positive")
    private BigDecimal rate;
    
    private BigDecimal changeRate;
    private String baseCurrency;
    private OffsetDateTime providerTimestamp;
    private String source;

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public BigDecimal getChangeRate() {
        return changeRate;
    }

    public void setChangeRate(BigDecimal changeRate) {
        this.changeRate = changeRate;
    }

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public void setBaseCurrency(String baseCurrency) {
        this.baseCurrency = baseCurrency;
    }

    public OffsetDateTime getProviderTimestamp() {
        return providerTimestamp;
    }

    public void setProviderTimestamp(OffsetDateTime providerTimestamp) {
        this.providerTimestamp = providerTimestamp;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
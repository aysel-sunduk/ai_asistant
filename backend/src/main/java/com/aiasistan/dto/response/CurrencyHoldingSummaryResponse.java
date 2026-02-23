/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

import java.math.BigDecimal;

/**
 * DTO: Döviz pozisyonu özet yanıtı.
 */
public class CurrencyHoldingSummaryResponse {

    private String baseCurrency;
    private BigDecimal totalCost;
    private BigDecimal totalCurrentValue;
    private BigDecimal totalDailyChange;
    private BigDecimal totalUnrealizedPnl;

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public void setBaseCurrency(String baseCurrency) {
        this.baseCurrency = baseCurrency;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public BigDecimal getTotalCurrentValue() {
        return totalCurrentValue;
    }

    public void setTotalCurrentValue(BigDecimal totalCurrentValue) {
        this.totalCurrentValue = totalCurrentValue;
    }

    public BigDecimal getTotalDailyChange() {
        return totalDailyChange;
    }

    public void setTotalDailyChange(BigDecimal totalDailyChange) {
        this.totalDailyChange = totalDailyChange;
    }

    public BigDecimal getTotalUnrealizedPnl() {
        return totalUnrealizedPnl;
    }

    public void setTotalUnrealizedPnl(BigDecimal totalUnrealizedPnl) {
        this.totalUnrealizedPnl = totalUnrealizedPnl;
    }
}
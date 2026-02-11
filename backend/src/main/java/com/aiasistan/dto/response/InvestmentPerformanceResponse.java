package com.aiasistan.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public class InvestmentPerformanceResponse {
    private BigDecimal totalCost;
    private BigDecimal estimatedCurrentValue;
    private BigDecimal unrealizedPnl;
    private BigDecimal dailyChange;
    private Map<String, BigDecimal> allocationByAssetTypePct;

    public InvestmentPerformanceResponse() {
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public BigDecimal getEstimatedCurrentValue() {
        return estimatedCurrentValue;
    }

    public void setEstimatedCurrentValue(BigDecimal estimatedCurrentValue) {
        this.estimatedCurrentValue = estimatedCurrentValue;
    }

    public BigDecimal getUnrealizedPnl() {
        return unrealizedPnl;
    }

    public void setUnrealizedPnl(BigDecimal unrealizedPnl) {
        this.unrealizedPnl = unrealizedPnl;
    }

    public BigDecimal getDailyChange() {
        return dailyChange;
    }

    public void setDailyChange(BigDecimal dailyChange) {
        this.dailyChange = dailyChange;
    }

    public Map<String, BigDecimal> getAllocationByAssetTypePct() {
        return allocationByAssetTypePct;
    }

    public void setAllocationByAssetTypePct(Map<String, BigDecimal> allocationByAssetTypePct) {
        this.allocationByAssetTypePct = allocationByAssetTypePct;
    }
}

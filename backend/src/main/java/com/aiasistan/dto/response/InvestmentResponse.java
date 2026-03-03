/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Lombok KULLANILMADI - elle getter/setter
 */
/**
 * DTO: Yatırım bilgisi için yanıt.
 */
public class InvestmentResponse {
    private UUID id;
    private String assetType;
    private String symbol;
    private BigDecimal quantity;
    private Long avgCostMinor;
    private BigDecimal currentValue;
    private BigDecimal currentRate;
    private BigDecimal changeRate;
    private BigDecimal dailyChangeValue;
    private String currency;
    private OffsetDateTime updatedAt;

    // Constructor
    public InvestmentResponse() {}

    // Builder pattern (manuel)
    public static class Builder {
        private UUID id;
        private String assetType;
        private String symbol;
        private BigDecimal quantity;
        private Long avgCostMinor;
        private BigDecimal currentValue;
        private BigDecimal currentRate;
        private BigDecimal changeRate;
        private BigDecimal dailyChangeValue;
        private String currency;
        private OffsetDateTime updatedAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder assetType(String assetType) { this.assetType = assetType; return this; }
        public Builder symbol(String symbol) { this.symbol = symbol; return this; }
        public Builder quantity(BigDecimal quantity) { this.quantity = quantity; return this; }
        public Builder avgCostMinor(Long avgCostMinor) { this.avgCostMinor = avgCostMinor; return this; }
        public Builder currentValue(BigDecimal currentValue) { this.currentValue = currentValue; return this; }
        public Builder currentRate(BigDecimal currentRate) { this.currentRate = currentRate; return this; }
        public Builder changeRate(BigDecimal changeRate) { this.changeRate = changeRate; return this; }
        public Builder dailyChangeValue(BigDecimal dailyChangeValue) { this.dailyChangeValue = dailyChangeValue; return this; }
        public Builder currency(String currency) { this.currency = currency; return this; }
        public Builder updatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public InvestmentResponse build() {
            InvestmentResponse response = new InvestmentResponse();
            response.id = this.id;
            response.assetType = this.assetType;
            response.symbol = this.symbol;
            response.quantity = this.quantity;
            response.avgCostMinor = this.avgCostMinor;
            response.currentValue = this.currentValue;
            response.currentRate = this.currentRate;
            response.changeRate = this.changeRate;
            response.dailyChangeValue = this.dailyChangeValue;
            response.currency = this.currency;
            response.updatedAt = this.updatedAt;
            return response;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    // Getter'lar
    public UUID getId() { return id; }
    public String getAssetType() { return assetType; }
    public String getSymbol() { return symbol; }
    public BigDecimal getQuantity() { return quantity; }
    public Long getAvgCostMinor() { return avgCostMinor; }
    public BigDecimal getCurrentValue() { return currentValue; }
    public BigDecimal getCurrentRate() { return currentRate; }
    public BigDecimal getChangeRate() { return changeRate; }
    public BigDecimal getDailyChangeValue() { return dailyChangeValue; }
    public String getCurrency() { return currency; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    // Setter'lar (JSON deserialize için)
    public void setId(UUID id) { this.id = id; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public void setAvgCostMinor(Long avgCostMinor) { this.avgCostMinor = avgCostMinor; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    public void setCurrentRate(BigDecimal currentRate) { this.currentRate = currentRate; }
    public void setChangeRate(BigDecimal changeRate) { this.changeRate = changeRate; }
    public void setDailyChangeValue(BigDecimal dailyChangeValue) { this.dailyChangeValue = dailyChangeValue; }
    public void setCurrency(String currency) { this.currency = currency; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

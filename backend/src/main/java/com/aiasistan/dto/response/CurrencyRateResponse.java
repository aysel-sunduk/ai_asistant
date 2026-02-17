package com.aiasistan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Lombok KULLANILMADI
 */
public class CurrencyRateResponse {
    private UUID id;
    private String currencyCode;
    private String currencyName;
    private BigDecimal rate;
    private BigDecimal changeRate;
    private BigDecimal changePercent;
    private String baseCurrency;
    private OffsetDateTime providerTimestamp;
    private LocalDateTime rateDate;
    private OffsetDateTime lastUpdatedAt;
    private LocalDateTime dbRecordedAt;
    private OffsetDateTime screenRefreshedAt;
    private String source;

    public CurrencyRateResponse() {}

    // Builder
    public static class Builder {
        private UUID id;
        private String currencyCode;
        private String currencyName;
        private BigDecimal rate;
        private BigDecimal changeRate;
        private BigDecimal changePercent;
        private String baseCurrency;
        private OffsetDateTime providerTimestamp;
        private LocalDateTime rateDate;
        private OffsetDateTime lastUpdatedAt;
        private LocalDateTime dbRecordedAt;
        private OffsetDateTime screenRefreshedAt;
        private String source;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder currencyCode(String currencyCode) { this.currencyCode = currencyCode; return this; }
        public Builder currencyName(String currencyName) { this.currencyName = currencyName; return this; }
        public Builder rate(BigDecimal rate) { this.rate = rate; return this; }
        public Builder changeRate(BigDecimal changeRate) { this.changeRate = changeRate; return this; }
        public Builder changePercent(BigDecimal changePercent) { this.changePercent = changePercent; return this; }
        public Builder baseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; return this; }
        public Builder providerTimestamp(OffsetDateTime providerTimestamp) { this.providerTimestamp = providerTimestamp; return this; }
        public Builder rateDate(LocalDateTime rateDate) { this.rateDate = rateDate; return this; }
        public Builder lastUpdatedAt(OffsetDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; return this; }
        public Builder dbRecordedAt(LocalDateTime dbRecordedAt) { this.dbRecordedAt = dbRecordedAt; return this; }
        public Builder screenRefreshedAt(OffsetDateTime screenRefreshedAt) { this.screenRefreshedAt = screenRefreshedAt; return this; }
        public Builder source(String source) { this.source = source; return this; }

        public CurrencyRateResponse build() {
            CurrencyRateResponse response = new CurrencyRateResponse();
            response.id = this.id;
            response.currencyCode = this.currencyCode;
            response.currencyName = this.currencyName;
            response.rate = this.rate;
            response.changeRate = this.changeRate;
            response.changePercent = this.changePercent;
            response.baseCurrency = this.baseCurrency;
            response.providerTimestamp = this.providerTimestamp;
            response.rateDate = this.rateDate;
            response.lastUpdatedAt = this.lastUpdatedAt;
            response.dbRecordedAt = this.dbRecordedAt;
            response.screenRefreshedAt = this.screenRefreshedAt;
            response.source = this.source;
            return response;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    // Getter/Setter
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getCurrencyName() { return currencyName; }
    public void setCurrencyName(String currencyName) { this.currencyName = currencyName; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public BigDecimal getChangeRate() { return changeRate; }
    public void setChangeRate(BigDecimal changeRate) { this.changeRate = changeRate; }
    public BigDecimal getChangePercent() { return changePercent; }
    public void setChangePercent(BigDecimal changePercent) { this.changePercent = changePercent; }
    public String getBaseCurrency() { return baseCurrency; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
    public OffsetDateTime getProviderTimestamp() { return providerTimestamp; }
    public void setProviderTimestamp(OffsetDateTime providerTimestamp) { this.providerTimestamp = providerTimestamp; }
    public LocalDateTime getRateDate() { return rateDate; }
    public void setRateDate(LocalDateTime rateDate) { this.rateDate = rateDate; }
    public OffsetDateTime getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(OffsetDateTime lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }
    public LocalDateTime getDbRecordedAt() { return dbRecordedAt; }
    public void setDbRecordedAt(LocalDateTime dbRecordedAt) { this.dbRecordedAt = dbRecordedAt; }
    public OffsetDateTime getScreenRefreshedAt() { return screenRefreshedAt; }
    public void setScreenRefreshedAt(OffsetDateTime screenRefreshedAt) { this.screenRefreshedAt = screenRefreshedAt; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}

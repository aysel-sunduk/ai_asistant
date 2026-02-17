package com.aiasistan.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

import com.aiasistan.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "currency_rates_latest")
public class CurrencyRateLatest extends BaseEntity {

    @Column(name = "currency_code", nullable = false, length = 32)
    private String currencyCode;

    @Column(name = "base_currency", nullable = false, length = 32)
    private String baseCurrency;

    @Column(name = "rate", nullable = false, precision = 19, scale = 4)
    private BigDecimal rate;

    @Column(name = "change_rate", precision = 10, scale = 4)
    private BigDecimal changeRate;

    @Column(name = "provider_timestamp", columnDefinition = "timestamptz")
    private OffsetDateTime providerTimestamp;

    @Column(name = "rate_date", nullable = false)
    private LocalDateTime rateDate;

    @Column(name = "source", length = 50)
    private String source;

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public void setBaseCurrency(String baseCurrency) {
        this.baseCurrency = baseCurrency;
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

    public OffsetDateTime getProviderTimestamp() {
        return providerTimestamp;
    }

    public void setProviderTimestamp(OffsetDateTime providerTimestamp) {
        this.providerTimestamp = providerTimestamp;
    }

    public LocalDateTime getRateDate() {
        return rateDate;
    }

    public void setRateDate(LocalDateTime rateDate) {
        this.rateDate = rateDate;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}

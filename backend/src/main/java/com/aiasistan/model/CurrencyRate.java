package com.aiasistan.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "currency_rates")
public class CurrencyRate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    
    @Column(name = "currency_code", nullable = false, length = 32)
    private String currencyCode;

    @Column(name = "base_currency", length = 32)
    private String baseCurrency;
    
    @Column(name = "rate", nullable = false, precision = 19, scale = 4)
    private BigDecimal rate;
    
    @Column(name = "change_rate", precision = 10, scale = 4)
    private BigDecimal changeRate;
    
    @Column(name = "rate_date", nullable = false)
    private LocalDateTime rateDate;
    
    @Column(name = "source", length = 50)
    private String source;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "provider_timestamp", columnDefinition = "timestamptz")
    private OffsetDateTime providerTimestamp;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (rateDate == null) {
            rateDate = LocalDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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
}

package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class InvestmentRequest {
    
    @NotBlank(message = "Asset type is required")
    private String assetType;
    
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private BigDecimal quantity;
    
    private Long avgCostMinor;
    
    private String currency;

    // Getter/Setter
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    
    public Long getAvgCostMinor() { return avgCostMinor; }
    public void setAvgCostMinor(Long avgCostMinor) { this.avgCostMinor = avgCostMinor; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO: Yatırım önerisi yanıtı.
 */
public class InvestmentRecommendationResponse {
    private UUID id;
    private String recommendationType;
    private String assetType;
    private String symbol;
    private BigDecimal confidenceScore;
    private String reason;
    private String riskLevel;
    private BigDecimal targetPrice;
    private LocalDateTime validUntil;

    public InvestmentRecommendationResponse() {
    }

    public static class Builder {
        private UUID id;
        private String recommendationType;
        private String assetType;
        private String symbol;
        private BigDecimal confidenceScore;
        private String reason;
        private String riskLevel;
        private BigDecimal targetPrice;
        private LocalDateTime validUntil;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder recommendationType(String recommendationType) { this.recommendationType = recommendationType; return this; }
        public Builder assetType(String assetType) { this.assetType = assetType; return this; }
        public Builder symbol(String symbol) { this.symbol = symbol; return this; }
        public Builder confidenceScore(BigDecimal confidenceScore) { this.confidenceScore = confidenceScore; return this; }
        public Builder reason(String reason) { this.reason = reason; return this; }
        public Builder riskLevel(String riskLevel) { this.riskLevel = riskLevel; return this; }
        public Builder targetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; return this; }
        public Builder validUntil(LocalDateTime validUntil) { this.validUntil = validUntil; return this; }

        public InvestmentRecommendationResponse build() {
            InvestmentRecommendationResponse response = new InvestmentRecommendationResponse();
            response.id = this.id;
            response.recommendationType = this.recommendationType;
            response.assetType = this.assetType;
            response.symbol = this.symbol;
            response.confidenceScore = this.confidenceScore;
            response.reason = this.reason;
            response.riskLevel = this.riskLevel;
            response.targetPrice = this.targetPrice;
            response.validUntil = this.validUntil;
            return response;
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getRecommendationType() { return recommendationType; }
    public void setRecommendationType(String recommendationType) { this.recommendationType = recommendationType; }
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public BigDecimal getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(BigDecimal confidenceScore) { this.confidenceScore = confidenceScore; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public BigDecimal getTargetPrice() { return targetPrice; }
    public void setTargetPrice(BigDecimal targetPrice) { this.targetPrice = targetPrice; }
    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }
}
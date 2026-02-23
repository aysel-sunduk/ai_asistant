/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

import com.aiasistan.common.dto.PageResponse;

/**
 * DTO: Finans paneli (dashboard) verileri için yanıt.
 */
public class FinanceDashboardResponse {

    private String baseCurrency;
    private OffsetDateTime generatedAt;
    private List<CurrencyRateResponse> popularRates;
    private List<CurrencyRateResponse> favoriteRates;
    private PageResponse<CurrencyHoldingResponse> holdings;
    private CurrencyHoldingSummaryResponse portfolioSummary;

    public String getBaseCurrency() {
        return baseCurrency;
    }

    public void setBaseCurrency(String baseCurrency) {
        this.baseCurrency = baseCurrency;
    }

    public OffsetDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(OffsetDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public List<CurrencyRateResponse> getPopularRates() {
        return popularRates;
    }

    public void setPopularRates(List<CurrencyRateResponse> popularRates) {
        this.popularRates = popularRates;
    }

    public List<CurrencyRateResponse> getFavoriteRates() {
        return favoriteRates;
    }

    public void setFavoriteRates(List<CurrencyRateResponse> favoriteRates) {
        this.favoriteRates = favoriteRates;
    }

    public PageResponse<CurrencyHoldingResponse> getHoldings() {
        return holdings;
    }

    public void setHoldings(PageResponse<CurrencyHoldingResponse> holdings) {
        this.holdings = holdings;
    }

    public CurrencyHoldingSummaryResponse getPortfolioSummary() {
        return portfolioSummary;
    }

    public void setPortfolioSummary(CurrencyHoldingSummaryResponse portfolioSummary) {
        this.portfolioSummary = portfolioSummary;
    }
}
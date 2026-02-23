/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/**
 * DTO: Favori yatırım ekleme/kaldırma isteği.
 */
public class FavoriteInvestmentRequest {

    @NotNull(message = "Investment id is required")
    private UUID investmentId;

    private Integer sortOrder;

    public UUID getInvestmentId() {
        return investmentId;
    }

    public void setInvestmentId(UUID investmentId) {
        this.investmentId = investmentId;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
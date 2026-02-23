/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO: Favori döviz ekleme/kaldırma isteği.
 */
public class FavoriteCurrencyRequest {

    @NotBlank(message = "Currency code is required")
    private String currencyCode;

    private Integer sortOrder;

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
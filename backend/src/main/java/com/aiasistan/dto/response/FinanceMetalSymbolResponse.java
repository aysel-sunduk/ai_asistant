/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto.response;

/**
 * DTO: Finansal metal sembolü yanıtı (ör. altın, gümüş).
 */
public class FinanceMetalSymbolResponse {

    private String code;
    private String displayName;
    private Integer sortOrder;

    public FinanceMetalSymbolResponse() {
    }

    public FinanceMetalSymbolResponse(String code, String displayName, Integer sortOrder) {
        this.code = code;
        this.displayName = displayName;
        this.sortOrder = sortOrder;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
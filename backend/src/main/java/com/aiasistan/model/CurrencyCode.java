package com.aiasistan.model;

public enum CurrencyCode {
    TRY("Türk Lirası"),
    USD("Amerikan Doları"),
    EUR("Euro"),
    GBP("İngiliz Sterlini");

    private final String displayName;

    CurrencyCode(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static CurrencyCode fromString(String code) {
        if (code == null || code.isBlank()) {
            return TRY;
        }
        try {
            return CurrencyCode.valueOf(code.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TRY; // Default
        }
    }
}

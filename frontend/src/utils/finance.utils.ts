// Kisa aciklama: Destekleyici modul kodu icerir.
export const formatCurrency = (val: number | null | undefined, currency = '₺'): string => {
    if (val == null) return `${currency}0`;
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${currency}${(val / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${currency}${(val / 1_000).toFixed(1)}K`;
    return `${currency}${val.toFixed(2)}`;
};

export const getPnlColor = (val: number) => (val >= 0 ? '#34D399' : '#FF6B6B');

export const getPnlPrefix = (val: number) => (val >= 0 ? '+' : '');

export const getInvestmentDisplayName = (symbol: string, assetType: string): string => {
    if (!symbol) return '';

    // Gold/Silver specific mappings
    if (symbol === 'GOLD_GRAM' || symbol === 'ALTIN') return 'Gram Altın';
    if (symbol === 'GOLD_CUMHURIYET') return 'Cumhuriyet Altını';
    if (symbol === 'SILVER_GRAM' || symbol === 'GUMUS') return 'Gram Gümüş';
    if (symbol === 'XAU/USD') return 'Ons Altın';
    if (symbol === 'XAG/USD') return 'Ons Gümüş';
    if (symbol === 'BTC') return 'Bitcoin';
    if (symbol === 'ETH') return 'Ethereum';

    // Common Currencies
    if (symbol === 'USD') return 'Amerikan Doları';
    if (symbol === 'EUR') return 'Euro';
    if (symbol === 'GBP') return 'Sterlin';
    if (symbol === 'CHF') return 'İsviçre Frangı';

    // For others, use symbol or basic formatting
    return symbol;
};
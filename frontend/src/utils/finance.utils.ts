export const formatCurrency = (val: number | null | undefined, currency = '₺'): string => {
    if (val == null) return `${currency}0`;
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return `${currency}${(val / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${currency}${(val / 1_000).toFixed(1)}K`;
    return `${currency}${val.toFixed(2)}`;
};

export const getPnlColor = (val: number) => (val >= 0 ? '#34D399' : '#FF6B6B');

export const getPnlPrefix = (val: number) => (val >= 0 ? '+' : '');

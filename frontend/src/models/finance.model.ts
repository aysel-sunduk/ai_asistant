// ─── Genel Pagination ───
export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

// ─── Investment ───
export interface InvestmentResponse {
    id: string;
    assetType: string;
    symbol: string;
    quantity: number;
    avgCostMinor: number;
    currentValue: number;
    currency: string;
    updatedAt: string;
}

export interface InvestmentRequest {
    assetType: string;
    symbol: string;
    quantity: number;
    avgCostMinor?: number;
    currency?: string;
}

export interface InvestmentPerformanceResponse {
    totalCost: number;
    estimatedCurrentValue: number;
    unrealizedPnl: number;
    dailyChange: number;
    allocationByAssetTypePct: Record<string, number>;
}

// ─── Currency ───
export interface CurrencyRateResponse {
    id: string;
    currencyCode: string;
    currencyName: string;
    rate: number;
    changeRate: number;
    baseCurrency: string;
    providerTimestamp: string;
    rateDate: string;
    source: string;
}

// ─── Asset Type Helpers ───
export const ASSET_TYPE_LABELS: Record<string, string> = {
    STOCK: 'Hisse',
    CRYPTO: 'Kripto',
    FUND: 'Fon',
    GOLD: 'Altın',
    COMMODITY: 'Emtia',
    OTHER: 'Diğer',
};

export const ASSET_TYPE_ICONS: Record<string, string> = {
    STOCK: 'trending-up',
    CRYPTO: 'logo-bitcoin',
    FUND: 'pie-chart',
    GOLD: 'diamond',
    COMMODITY: 'cube',
    OTHER: 'ellipsis-horizontal',
};

export const ASSET_TYPE_COLORS: Record<string, string> = {
    STOCK: '#5B8DEF',
    CRYPTO: '#F7931A',
    FUND: '#4ECDC4',
    GOLD: '#FFD700',
    COMMODITY: '#A78BFA',
    OTHER: '#9BA1A6',
};

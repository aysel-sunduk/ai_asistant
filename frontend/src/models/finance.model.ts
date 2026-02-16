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

export interface CurrencyDetailResponse {
    currencyCode: string;
    baseCurrency: string;
    open: number;
    high: number;
    low: number;
    close: number;
    date: string;
}

export interface SupportedCurrencyResponse {
    code: string;
    name: string;
}

// ─── Favorites ───
export interface FavoriteCurrencyResponse {
    id: string;
    currencyCode: string;
    currencyName: string;
    rate: number;
    changeRate: number;
    baseCurrency: string;
    rateDate: string;
}

export interface FavoriteCurrencyRequest {
    currencyCode: string;
}

// ─── Currency Holdings ───
export interface CurrencyHoldingResponse {
    id: string;
    currencyCode: string;
    amount: number;
    buyRate: number;
    buyDate: string;
    currentRate: number;
    profitLoss: number;
    profitLossPercent: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CurrencyHoldingRequest {
    currencyCode: string;
    amount: number;
    buyRate: number;
    buyDate?: string;
    notes?: string;
}

export interface CurrencyHoldingSummary {
    totalInvestedTRY: number;
    currentValueTRY: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    holdingCount: number;
    holdings: CurrencyHoldingResponse[];
}

// ─── Dashboard ───
export interface FinanceDashboardResponse {
    totalPortfolioValue: number;
    totalInvestmentValue: number;
    totalCurrencyHoldingValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    investmentCount: number;
    currencyHoldingCount: number;
    topInvestments: InvestmentResponse[];
    favoriteCurrencies: FavoriteCurrencyResponse[];
    allocationByAssetTypePct: Record<string, number>;
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

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
    lastUpdatedAt?: string;
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

export type SupportedCurrencyResponse = string;

// ─── Favorites ───
export interface FavoriteCurrencyResponse {
    id: string;
    currencyCode: string;
    currencyName: string;
    rate: number;
    changeRate: number;
    baseCurrency: string;
    rateDate: string;
    lastUpdatedAt?: string;
}

export interface FavoriteCurrencyRequest {
    currencyCode: string;
}

export interface FavoriteInvestmentRequest {
    investmentId: string;
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
    SILVER: 'Gümüş',
    COMMODITY: 'Emtia',
    DST: 'Mevduat',
    REIT: 'GYO',
    BOND: 'Tahvil',
    ETF: 'ETF',
    WARRANT: 'Varant',
    OTHER: 'Diğer',
    CURRENCY: 'Döviz',
};

export const ASSET_TYPE_ICONS: Record<string, string> = {
    STOCK: 'bar-chart',
    CRYPTO: 'logo-bitcoin',
    FUND: 'pie-chart',
    GOLD: 'medal',
    SILVER: 'medal-outline',
    COMMODITY: 'cube',
    DST: 'wallet',
    REIT: 'business',
    BOND: 'document-text',
    ETF: 'layers',
    WARRANT: 'flash',
    OTHER: 'pricetag',
    CURRENCY: 'cash',
};

export const ASSET_TYPE_COLORS: Record<string, string> = {
    STOCK: '#5B8DEF',
    CRYPTO: '#F7931A',
    FUND: '#4ECDC4',
    GOLD: '#FFD700',
    SILVER: '#C0C0C0',
    COMMODITY: '#A78BFA',
    DST: '#2ECC71',
    REIT: '#E74C3C',
    BOND: '#95A5A6',
    ETF: '#34495E',
    WARRANT: '#E67E22',
    OTHER: '#9BA1A6',
    CURRENCY: '#22C55E',
};

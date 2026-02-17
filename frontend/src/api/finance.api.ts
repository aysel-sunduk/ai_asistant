import type { ApiResponse } from '../models/auth.model';
import type {
    CurrencyDetailResponse,
    CurrencyHoldingRequest,
    CurrencyHoldingResponse,
    CurrencyHoldingSummary,
    CurrencyRateResponse,
    FavoriteCurrencyRequest,
    FavoriteCurrencyResponse,
    FavoriteInvestmentRequest,
    FinanceDashboardResponse,
    InvestmentPerformanceResponse,
    InvestmentRequest,
    InvestmentResponse,
    PageResponse,
    SupportedCurrencyResponse,
} from '../models/finance.model';
import apiClient from './client';

export const financeApi = {
    // ─── Investments ───
    getInvestments: (page = 0, size = 20, sortBy = 'updatedAt', sortDirection = 'DESC') =>
        apiClient.get<ApiResponse<PageResponse<InvestmentResponse>>>('/v1/finance/investments', {
            params: { page, size, sortBy, sortDirection },
        }),

    getInvestmentById: (id: string) =>
        apiClient.get<ApiResponse<InvestmentResponse>>(`/v1/finance/investments/${id}`),

    addInvestment: (data: InvestmentRequest) =>
        apiClient.post<ApiResponse<InvestmentResponse>>('/v1/finance/investments', data),

    deleteInvestment: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`/v1/finance/investments/${id}`),

    updateInvestmentPrice: (id: string, avgCostMinor: number) =>
        apiClient.put<ApiResponse<InvestmentResponse>>(
            `/v1/finance/investments/${id}/price`,
            null,
            { params: { avgCostMinor } },
        ),

    getTotalInvestment: () =>
        apiClient.get<ApiResponse<number>>('/v1/finance/investments/total'),

    getPortfolioPerformance: () =>
        apiClient.get<ApiResponse<InvestmentPerformanceResponse>>('/v1/finance/investments/performance'),

    getFavoriteInvestments: () =>
        apiClient.get<ApiResponse<InvestmentResponse[]>>('/v1/finance/investments/favorites'),

    toggleFavoriteInvestment: (data: FavoriteInvestmentRequest) =>
        apiClient.post<ApiResponse<void>>('/v1/finance/investments/favorites', data),

    // ─── Dashboard ───
    getDashboard: () =>
        apiClient.get<ApiResponse<FinanceDashboardResponse>>('/v1/finance/dashboard'),

    // ─── Currencies ───
    getCurrencies: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<PageResponse<CurrencyRateResponse>>>('/v1/finance/currencies', {
            params: { page, size },
        }),

    getPopularCurrencies: () =>
        apiClient.get<ApiResponse<CurrencyRateResponse[]>>('/v1/finance/currencies/popular'),

    getSupportedCurrencies: () =>
        apiClient.get<ApiResponse<SupportedCurrencyResponse[]>>('/v1/finance/currencies/supported'),

    getLatestRates: (base = 'TRY') =>
        apiClient.get<ApiResponse<CurrencyRateResponse[]>>('/v1/finance/currencies/latest', {
            params: { base },
        }),

    getLatestRate: (code: string) =>
        apiClient.get<ApiResponse<CurrencyRateResponse>>(`/v1/finance/currencies/latest/${code}`),

    getHistoricalRates: (code: string, startDate: string, endDate: string) =>
        apiClient.get<ApiResponse<CurrencyRateResponse[]>>(
            `/v1/finance/currencies/historical/${code}`,
            { params: { startDate, endDate } },
        ),

    getCurrencyDetails: (from: string, to = 'TRY') =>
        apiClient.get<ApiResponse<CurrencyDetailResponse>>('/v1/finance/currencies/details', {
            params: { from, to },
        }),

    fetchLiveRates: () =>
        apiClient.post<ApiResponse<void>>('/v1/finance/currencies/live'),

    // ─── Favorites (backend) ───
    getFavorites: () =>
        apiClient.get<ApiResponse<FavoriteCurrencyResponse[]>>('/v1/finance/currencies/favorites'),

    addFavorite: (data: FavoriteCurrencyRequest) =>
        apiClient.post<ApiResponse<FavoriteCurrencyResponse>>('/v1/finance/currencies/favorites', data),

    removeFavorite: (code: string) =>
        apiClient.delete<ApiResponse<void>>(`/v1/finance/currencies/favorites/${code}`),

    // ─── Currency Holdings ───
    getCurrencyHoldings: () =>
        apiClient.get<ApiResponse<CurrencyHoldingResponse[]>>('/v1/finance/currency-holdings'),

    addCurrencyHolding: (data: CurrencyHoldingRequest) =>
        apiClient.post<ApiResponse<CurrencyHoldingResponse>>('/v1/finance/currency-holdings', data),

    updateCurrencyHolding: (id: string, data: CurrencyHoldingRequest) =>
        apiClient.put<ApiResponse<CurrencyHoldingResponse>>(`/v1/finance/currency-holdings/${id}`, data),

    deleteCurrencyHolding: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`/v1/finance/currency-holdings/${id}`),

    getCurrencyHoldingsSummary: () =>
        apiClient.get<ApiResponse<CurrencyHoldingSummary>>('/v1/finance/currency-holdings/summary'),
};

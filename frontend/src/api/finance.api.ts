import type { ApiResponse } from '../models/auth.model';
import type {
    CurrencyRateResponse,
    InvestmentPerformanceResponse,
    InvestmentRequest,
    InvestmentResponse,
    PageResponse,
} from '../models/finance.model';
import apiClient from './client';

export const financeApi = {
    // ─── Investments ───
    getInvestments: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<PageResponse<InvestmentResponse>>>('/v1/finance/investments', {
            params: { page, size },
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

    // ─── Currencies ───
    getCurrencies: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<PageResponse<CurrencyRateResponse>>>('/v1/finance/currencies', {
            params: { page, size },
        }),

    getLatestRate: (code: string) =>
        apiClient.get<ApiResponse<CurrencyRateResponse>>(`/v1/finance/currencies/latest/${code}`),

    getHistoricalRates: (code: string, startDate: string, endDate: string) =>
        apiClient.get<ApiResponse<CurrencyRateResponse[]>>(
            `/v1/finance/currencies/historical/${code}`,
            { params: { startDate, endDate } },
        ),
};

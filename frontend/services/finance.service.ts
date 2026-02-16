import { financeApi } from '../src/api/finance.api';
import type {
    CurrencyDetailResponse,
    CurrencyHoldingRequest,
    CurrencyHoldingResponse,
    CurrencyHoldingSummary,
    CurrencyRateResponse,
    FavoriteCurrencyRequest,
    FavoriteCurrencyResponse,
    FinanceDashboardResponse,
    InvestmentPerformanceResponse,
    InvestmentRequest,
    InvestmentResponse,
    PageResponse,
    SupportedCurrencyResponse,
} from '../src/models/finance.model';

export const financeService = {
    // ─── Investments ───
    getInvestments: async (page = 0, size = 20, sortBy = 'updatedAt', sortDirection = 'DESC'): Promise<PageResponse<InvestmentResponse>> => {
        const response = await financeApi.getInvestments(page, size, sortBy, sortDirection);
        return response.data.data;
    },

    getInvestmentById: async (id: string): Promise<InvestmentResponse> => {
        const response = await financeApi.getInvestmentById(id);
        return response.data.data;
    },

    addInvestment: async (data: InvestmentRequest): Promise<InvestmentResponse> => {
        console.log('[FinanceService] addInvestment payload:', data);
        const response = await financeApi.addInvestment(data);
        console.log('[FinanceService] addInvestment RAW:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    },

    deleteInvestment: async (id: string): Promise<void> => {
        await financeApi.deleteInvestment(id);
    },

    updateInvestmentPrice: async (id: string, avgCostMinor: number): Promise<InvestmentResponse> => {
        const response = await financeApi.updateInvestmentPrice(id, avgCostMinor);
        return response.data.data;
    },

    getTotalInvestment: async (): Promise<number> => {
        const response = await financeApi.getTotalInvestment();
        return response.data.data;
    },

    getPortfolioPerformance: async (): Promise<InvestmentPerformanceResponse> => {
        const response = await financeApi.getPortfolioPerformance();
        return response.data.data;
    },

    // ─── Dashboard ───
    getDashboard: async (): Promise<FinanceDashboardResponse> => {
        const response = await financeApi.getDashboard();
        console.log('[FinanceService] getDashboard RAW:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    },

    // ─── Currencies ───
    getCurrencies: async (page = 0, size = 20): Promise<PageResponse<CurrencyRateResponse>> => {
        const response = await financeApi.getCurrencies(page, size);
        return response.data.data;
    },

    getPopularCurrencies: async (): Promise<CurrencyRateResponse[]> => {
        const response = await financeApi.getPopularCurrencies();
        return response.data.data;
    },

    getSupportedCurrencies: async (): Promise<SupportedCurrencyResponse[]> => {
        const response = await financeApi.getSupportedCurrencies();
        return response.data.data;
    },

    getLatestRates: async (base = 'TRY'): Promise<CurrencyRateResponse[]> => {
        const response = await financeApi.getLatestRates(base);
        return response.data.data;
    },

    getLatestRate: async (code: string): Promise<CurrencyRateResponse> => {
        const response = await financeApi.getLatestRate(code);
        return response.data.data;
    },

    getHistoricalRates: async (
        code: string,
        startDate: string,
        endDate: string,
    ): Promise<CurrencyRateResponse[]> => {
        const response = await financeApi.getHistoricalRates(code, startDate, endDate);
        return response.data.data;
    },

    getCurrencyDetails: async (from: string, to = 'TRY'): Promise<CurrencyDetailResponse> => {
        const response = await financeApi.getCurrencyDetails(from, to);
        return response.data.data;
    },

    fetchLiveRates: async (): Promise<void> => {
        await financeApi.fetchLiveRates();
    },

    // ─── Favorites (Backend) ───
    getFavorites: async (): Promise<FavoriteCurrencyResponse[]> => {
        const response = await financeApi.getFavorites();
        console.log('[FinanceService] getFavorites RAW:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    },

    addFavorite: async (data: FavoriteCurrencyRequest): Promise<FavoriteCurrencyResponse> => {
        const response = await financeApi.addFavorite(data);
        console.log('[FinanceService] addFavorite RAW:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    },

    removeFavorite: async (code: string): Promise<void> => {
        await financeApi.removeFavorite(code);
        console.log('[FinanceService] removeFavorite:', code);
    },

    // ─── Currency Holdings ───
    getCurrencyHoldings: async (): Promise<CurrencyHoldingResponse[]> => {
        const response = await financeApi.getCurrencyHoldings();
        console.log('[FinanceService] getCurrencyHoldings RAW:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    },

    addCurrencyHolding: async (data: CurrencyHoldingRequest): Promise<CurrencyHoldingResponse> => {
        console.log('[FinanceService] addCurrencyHolding payload:', data);
        const response = await financeApi.addCurrencyHolding(data);
        console.log('[FinanceService] addCurrencyHolding RAW:', JSON.stringify(response.data, null, 2));
        return response.data.data;
    },

    updateCurrencyHolding: async (id: string, data: CurrencyHoldingRequest): Promise<CurrencyHoldingResponse> => {
        const response = await financeApi.updateCurrencyHolding(id, data);
        return response.data.data;
    },

    deleteCurrencyHolding: async (id: string): Promise<void> => {
        await financeApi.deleteCurrencyHolding(id);
    },

    getCurrencyHoldingsSummary: async (): Promise<CurrencyHoldingSummary> => {
        const response = await financeApi.getCurrencyHoldingsSummary();
        return response.data.data;
    },
};

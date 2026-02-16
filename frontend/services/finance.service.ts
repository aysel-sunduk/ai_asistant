import { financeApi } from '../src/api/finance.api';
import type {
    CurrencyRateResponse,
    InvestmentPerformanceResponse,
    InvestmentRequest,
    InvestmentResponse,
    PageResponse,
} from '../src/models/finance.model';

export const financeService = {
    // ─── Investments ───
    getInvestments: async (page = 0, size = 20): Promise<PageResponse<InvestmentResponse>> => {
        const response = await financeApi.getInvestments(page, size);
        return response.data.data;
    },

    getInvestmentById: async (id: string): Promise<InvestmentResponse> => {
        const response = await financeApi.getInvestmentById(id);
        return response.data.data;
    },

    addInvestment: async (data: InvestmentRequest): Promise<InvestmentResponse> => {
        const response = await financeApi.addInvestment(data);
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

    // ─── Currencies ───
    getCurrencies: async (page = 0, size = 20): Promise<PageResponse<CurrencyRateResponse>> => {
        const response = await financeApi.getCurrencies(page, size);
        return response.data.data;
    },

    getLatestRate: async (code: string): Promise<CurrencyRateResponse> => {
        const response = await financeApi.getLatestRate(code);
        return response.data.data;
    },
};

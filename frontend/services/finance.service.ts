import { financeApi } from '../src/api/finance.api';
import type { FinanceAccount, FinanceCategory, FinanceTransaction, Investment } from '../src/models/finance.model';

export const financeService = {
    // Hesaplar
    getAccounts: async (): Promise<FinanceAccount[]> => {
        const response = await financeApi.getAccounts();
        return response.data;
    },
    createAccount: async (data: Partial<FinanceAccount>): Promise<FinanceAccount> => {
        const response = await financeApi.createAccount(data);
        return response.data;
    },

    // Kategoriler
    getCategories: async (): Promise<FinanceCategory[]> => {
        const response = await financeApi.getCategories();
        return response.data;
    },
    createCategory: async (data: Partial<FinanceCategory>): Promise<FinanceCategory> => {
        const response = await financeApi.createCategory(data);
        return response.data;
    },

    // İşlemler
    getTransactions: async (params?: Record<string, unknown>): Promise<FinanceTransaction[]> => {
        const response = await financeApi.getTransactions(params);
        return response.data;
    },
    createTransaction: async (data: Partial<FinanceTransaction>): Promise<FinanceTransaction> => {
        const response = await financeApi.createTransaction(data);
        return response.data;
    },

    // Yatırımlar
    getInvestments: async (): Promise<Investment[]> => {
        const response = await financeApi.getInvestments();
        return response.data;
    },
    createInvestment: async (data: Partial<Investment>): Promise<Investment> => {
        const response = await financeApi.createInvestment(data);
        return response.data;
    },
};

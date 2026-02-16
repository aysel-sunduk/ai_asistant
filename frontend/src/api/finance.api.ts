import type { FinanceAccount, FinanceCategory, FinanceTransaction, Investment } from '../models/finance.model';
import apiClient from './client';

export const financeApi = {
    // Hesaplar
    getAccounts: () => apiClient.get<FinanceAccount[]>('/finance/accounts'),
    createAccount: (data: Partial<FinanceAccount>) => apiClient.post<FinanceAccount>('/finance/accounts', data),

    // Kategoriler
    getCategories: () => apiClient.get<FinanceCategory[]>('/finance/categories'),
    createCategory: (data: Partial<FinanceCategory>) => apiClient.post<FinanceCategory>('/finance/categories', data),

    // İşlemler
    getTransactions: (params?: Record<string, unknown>) => apiClient.get<FinanceTransaction[]>('/finance/transactions', { params }),
    createTransaction: (data: Partial<FinanceTransaction>) => apiClient.post<FinanceTransaction>('/finance/transactions', data),

    // Yatırımlar
    getInvestments: () => apiClient.get<Investment[]>('/finance/investments'),
    createInvestment: (data: Partial<Investment>) => apiClient.post<Investment>('/finance/investments', data),
};

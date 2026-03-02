// Kisa aciklama: Servis akislarini yonetir.
import { familyApi } from '../src/api/family.api';
import type {
    FamilyBirthdayPage,
    FamilyBirthdayRequest,
    FamilyBirthdayResponse,
    FamilyFinanceReportResponse,
    FamilyFinanceSummaryResponse,
    FamilyTransactionPage,
    FamilyTransactionRequest,
    FamilyTransactionResponse,
    MonthlyFinanceSummaryResponse,
} from '../src/models/family.model';

export const familyService = {
    getBirthdays: async (page = 0, size = 50): Promise<FamilyBirthdayPage> => {
        const response = await familyApi.getBirthdays(page, size);
        return response.data.data;
    },

    createBirthday: async (data: FamilyBirthdayRequest): Promise<FamilyBirthdayResponse> => {
        const response = await familyApi.createBirthday(data);
        return response.data.data;
    },

    updateBirthday: async (id: string, data: FamilyBirthdayRequest): Promise<FamilyBirthdayResponse> => {
        const response = await familyApi.updateBirthday(id, data);
        return response.data.data;
    },

    deleteBirthday: async (id: string): Promise<void> => {
        await familyApi.deleteBirthday(id);
    },

    getTransactions: async (page = 0, size = 100, startDate?: string, endDate?: string): Promise<FamilyTransactionPage> => {
        const response = await familyApi.getTransactions(page, size, startDate, endDate);
        return response.data.data;
    },

    createTransaction: async (data: FamilyTransactionRequest): Promise<FamilyTransactionResponse> => {
        const response = await familyApi.createTransaction(data);
        return response.data.data;
    },

    updateTransaction: async (id: string, data: FamilyTransactionRequest): Promise<FamilyTransactionResponse> => {
        const response = await familyApi.updateTransaction(id, data);
        return response.data.data;
    },

    deleteTransaction: async (id: string): Promise<void> => {
        await familyApi.deleteTransaction(id);
    },

    getTransactionsSummary: async (startDate: string, endDate: string): Promise<FamilyFinanceSummaryResponse> => {
        const response = await familyApi.getTransactionsSummary(startDate, endDate);
        return response.data.data;
    },

    getTransactionsReport: async (period: 'WEEKLY' | 'MONTHLY'): Promise<FamilyFinanceReportResponse> => {
        const response = await familyApi.getTransactionsReport(period);
        return response.data.data;
    },

    getFinanceHistory: async (months = 12, startDate?: string, endDate?: string): Promise<MonthlyFinanceSummaryResponse[]> => {
        const response = await familyApi.getFinanceHistory(months, startDate, endDate);
        return response.data.data;
    },
};
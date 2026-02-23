// Kisa aciklama: Backend API cagrilarini toplar.
import type { ApiResponse } from '../models/auth.model';
import type {
    FamilyBirthdayPage,
    FamilyBirthdayRequest,
    FamilyBirthdayResponse,
    FamilyFinanceReportResponse,
    FamilyFinanceSummaryResponse,
    FamilyTransactionPage,
    FamilyTransactionRequest,
    FamilyTransactionResponse,
} from '../models/family.model';
import apiClient from './client';

const BASE_PATH = '/v1/family';

export const familyApi = {
    getBirthdays: (page = 0, size = 50) =>
        apiClient.get<ApiResponse<FamilyBirthdayPage>>(`${BASE_PATH}/birthdays`, {
            params: { page, size },
        }),

    createBirthday: (data: FamilyBirthdayRequest) =>
        apiClient.post<ApiResponse<FamilyBirthdayResponse>>(`${BASE_PATH}/birthdays`, data),

    updateBirthday: (id: string, data: FamilyBirthdayRequest) =>
        apiClient.put<ApiResponse<FamilyBirthdayResponse>>(`${BASE_PATH}/birthdays/${id}`, data),

    deleteBirthday: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/birthdays/${id}`),

    getTransactions: (page = 0, size = 100) =>
        apiClient.get<ApiResponse<FamilyTransactionPage>>(`${BASE_PATH}/transactions`, {
            params: { page, size, sort: 'occurredOn,desc' },
        }),

    createTransaction: (data: FamilyTransactionRequest) =>
        apiClient.post<ApiResponse<FamilyTransactionResponse>>(`${BASE_PATH}/transactions`, data),

    updateTransaction: (id: string, data: FamilyTransactionRequest) =>
        apiClient.put<ApiResponse<FamilyTransactionResponse>>(`${BASE_PATH}/transactions/${id}`, data),

    deleteTransaction: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/transactions/${id}`),

    getTransactionsSummary: (startDate: string, endDate: string) =>
        apiClient.get<ApiResponse<FamilyFinanceSummaryResponse>>(`${BASE_PATH}/transactions/summary`, {
            params: { startDate, endDate },
        }),

    getTransactionsReport: (period: 'WEEKLY' | 'MONTHLY') =>
        apiClient.get<ApiResponse<FamilyFinanceReportResponse>>(`${BASE_PATH}/transactions/report`, {
            params: { period },
        }),
};
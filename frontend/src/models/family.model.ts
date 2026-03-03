// Kisa aciklama: Destekleyici modul kodu icerir.
export interface FamilyBirthdayRequest {
    fullName: string;
    relationship?: string;
    birthDate: string; // YYYY-MM-DD
    phone?: string;
    email?: string;
    note?: string;
    bloodType?: string;
}

export interface FamilyBirthdayResponse {
    id: string;
    fullName: string;
    relationship?: string;
    birthDate: string;
    phone?: string;
    email?: string;
    note?: string;
    bloodType?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FamilyBirthdayPage {
    content: FamilyBirthdayResponse[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export type FamilyTransactionType = 'INCOME' | 'EXPENSE';

export interface FamilyTransactionRequest {
    type: FamilyTransactionType;
    amountMinor: number;
    currency: string;
    category?: string;
    occurredOn: string; // YYYY-MM-DD
    note?: string;
}

export interface FamilyTransactionResponse {
    id: string;
    type: FamilyTransactionType;
    amountMinor: number;
    currency: string;
    category?: string;
    occurredOn: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FamilyTransactionPage {
    content: FamilyTransactionResponse[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface FamilyFinanceSummaryResponse {
    totalIncome: number;
    totalExpense: number;
    balance: number;
}

export interface FamilyFinanceBucket {
    label: string;
    startDate: string;
    endDate: string;
    income: number;
    expense: number;
    balance: number;
}

export interface FamilyFinanceReportResponse {
    period: 'WEEKLY' | 'MONTHLY';
    startDate: string;
    endDate: string;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    previousIncome: number;
    previousExpense: number;
    previousBalance: number;
    incomeChangePct: number;
    expenseChangePct: number;
    balanceChangePct: number;
    buckets: FamilyFinanceBucket[];
}

export interface MonthlyFinanceSummaryResponse {
    monthLabel: string;
    startDate: string;
    endDate: string;
    income: number;
    expense: number;
    balance: number;
}
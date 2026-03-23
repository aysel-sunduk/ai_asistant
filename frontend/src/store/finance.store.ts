// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { InvestmentResponse } from '../models/finance.model';

interface FinanceState {
    accounts: any[];
    categories: any[];
    transactions: any[];
    investments: InvestmentResponse[];
    isLoading: boolean;

    setAccounts: (accounts: any[]) => void;
    setCategories: (categories: any[]) => void;
    setTransactions: (transactions: any[]) => void;
    setInvestments: (investments: InvestmentResponse[]) => void;
    setLoading: (loading: boolean) => void;
    addTransaction: (transaction: any) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
    accounts: [],
    categories: [],
    transactions: [],
    investments: [],
    isLoading: false,

    setAccounts: (accounts) => set({ accounts }),
    setCategories: (categories) => set({ categories }),
    setTransactions: (transactions) => set({ transactions }),
    setInvestments: (investments) => set({ investments }),
    setLoading: (isLoading) => set({ isLoading }),
    addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),
}));
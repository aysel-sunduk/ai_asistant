import { create } from 'zustand';
import type { FinanceAccount, FinanceCategory, FinanceTransaction, Investment } from '../models/finance.model';

interface FinanceState {
    accounts: FinanceAccount[];
    categories: FinanceCategory[];
    transactions: FinanceTransaction[];
    investments: Investment[];
    isLoading: boolean;

    setAccounts: (accounts: FinanceAccount[]) => void;
    setCategories: (categories: FinanceCategory[]) => void;
    setTransactions: (transactions: FinanceTransaction[]) => void;
    setInvestments: (investments: Investment[]) => void;
    setLoading: (loading: boolean) => void;
    addTransaction: (transaction: FinanceTransaction) => void;
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

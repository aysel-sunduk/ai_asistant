// @ts-nocheck
// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback } from 'react';
import { financeService } from '../../services/finance.service';
import type { FinanceTransaction } from '../models/finance.model';
import { useFinanceStore } from '../store/finance.store';

export function useFinance() {
    const store = useFinanceStore();

    const fetchAccounts = useCallback(async () => {
        store.setLoading(true);
        try {
            const accounts = await financeService.getAccounts();
            store.setAccounts(accounts);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        const categories = await financeService.getCategories();
        store.setCategories(categories);
    }, []);

    const fetchTransactions = useCallback(async (params?: Record<string, unknown>) => {
        store.setLoading(true);
        try {
            const transactions = await financeService.getTransactions(params);
            store.setTransactions(transactions);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createTransaction = useCallback(async (data: Partial<FinanceTransaction>) => {
        const transaction = await financeService.createTransaction(data);
        store.addTransaction(transaction);
        return transaction;
    }, []);

    const fetchInvestments = useCallback(async () => {
        const investments = await financeService.getInvestments();
        store.setInvestments(investments);
    }, []);

    return {
        ...store,
        fetchAccounts,
        fetchCategories,
        fetchTransactions,
        createTransaction,
        fetchInvestments,
    };
}
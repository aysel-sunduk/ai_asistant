// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { FinanceDashboardResponse, InvestmentResponse } from '../models/finance.model';
import { financeService } from '../../services/finance.service';

interface FinanceState {
    accounts: any[];
    categories: any[];
    transactions: any[];
    investments: InvestmentResponse[];
    isLoading: boolean;

    // Dashboard & Performance State
    dashboard: FinanceDashboardResponse | null;
    performance: any | null;
    favCurrencies: any[];
    favInvestments: any[];
    aiRecommendations: any[];
    error: string | null;

    setAccounts: (accounts: any[]) => void;
    setCategories: (categories: any[]) => void;
    setTransactions: (transactions: any[]) => void;
    setInvestments: (investments: InvestmentResponse[]) => void;
    setLoading: (loading: boolean) => void;
    addTransaction: (transaction: any) => void;

    // Unified Refresh Action
    fetchDashboardData: () => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    accounts: [],
    categories: [],
    transactions: [],
    investments: [],
    isLoading: false,

    dashboard: null,
    performance: null,
    favCurrencies: [],
    favInvestments: [],
    aiRecommendations: [],
    error: null,

    setAccounts: (accounts) => set({ accounts }),
    setCategories: (categories) => set({ categories }),
    setTransactions: (transactions) => set({ transactions }),
    setInvestments: (investments) => set({ investments }),
    setLoading: (isLoading) => set({ isLoading }),
    addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),

    fetchDashboardData: async () => {
        set({ isLoading: true });
        try {
            console.log('[FinanceStore] Refreshing all dashboard data...');
            
            // Concurrent fetching for better performance
            const [dash, favCur, favInv, aiRec, perf] = await Promise.allSettled([
                financeService.getDashboard(),
                financeService.getFavorites(),
                financeService.getFavoriteInvestments(),
                financeService.getInvestmentRecommendations(),
                financeService.getPortfolioPerformance()
            ]);

            const nextState: Partial<FinanceState> = {};

            if (dash.status === 'fulfilled') nextState.dashboard = dash.value;
            if (favCur.status === 'fulfilled') nextState.favCurrencies = Array.isArray(favCur.value) ? favCur.value : [];
            if (favInv.status === 'fulfilled') nextState.favInvestments = Array.isArray(favInv.value) ? favInv.value : [];
            if (aiRec.status === 'fulfilled') nextState.aiRecommendations = Array.isArray(aiRec.value) ? aiRec.value : [];
            if (perf.status === 'fulfilled') nextState.performance = perf.value;

            set({ ...nextState, error: null });
        } catch (err: any) {
            console.error('[FinanceStore] Fetch error:', err);
            set({ error: err.message || 'Veri yüklenemedi' });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteInvestment: async (id: string) => {
        set({ isLoading: true });
        try {
            await financeService.deleteInvestment(id);
            // Refresh dashboard data immediately to reflect the deletion
            const dash = get().fetchDashboardData();
            await dash;
        } catch (err: any) {
            console.error('[FinanceStore] Delete error:', err);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    }
}));
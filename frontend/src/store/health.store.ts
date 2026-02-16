import { create } from 'zustand';
import type { HealthLog, HealthLogType } from '../models/health.model';

interface HealthState {
    logs: HealthLog[];
    isLoading: boolean;
    selectedDate: string; // YYYY-MM-DD

    setLogs: (logs: HealthLog[]) => void;
    addLog: (log: HealthLog) => void;
    removeLog: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setSelectedDate: (date: string) => void;
    getLogsByType: (type: HealthLogType) => HealthLog[];
    getTodayLogs: () => HealthLog[];
}

const today = new Date().toISOString().split('T')[0];

export const useHealthStore = create<HealthState>((set, get) => ({
    logs: [],
    isLoading: false,
    selectedDate: today,

    setLogs: (logs) => set({ logs }),
    addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
    removeLog: (id) => set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),

    getLogsByType: (type) => {
        const { logs, selectedDate } = get();
        return logs.filter((l) => l.logType === type && l.logDate === selectedDate);
    },

    getTodayLogs: () => {
        const { logs, selectedDate } = get();
        return logs.filter((l) => l.logDate === selectedDate);
    },
}));

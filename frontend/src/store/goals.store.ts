import { create } from 'zustand';
import type { Goal } from '../models/goal.model';

interface GoalsState {
    goals: Goal[];
    selectedGoal: Goal | null;
    isLoading: boolean;

    setGoals: (goals: Goal[]) => void;
    setSelectedGoal: (goal: Goal | null) => void;
    addGoal: (goal: Goal) => void;
    updateGoal: (goal: Goal) => void;
    removeGoal: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
    goals: [],
    selectedGoal: null,
    isLoading: false,

    setGoals: (goals) => set({ goals }),
    setSelectedGoal: (selectedGoal) => set({ selectedGoal }),
    addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
    updateGoal: (goal) =>
        set((state) => ({
            goals: state.goals.map((g) => (g.id === goal.id ? goal : g)),
        })),
    removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
}));

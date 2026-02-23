// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { AIInteraction } from '../models/ai.model';

interface AIState {
    interactions: AIInteraction[];
    currentResponse: string | null;
    isLoading: boolean;

    setInteractions: (interactions: AIInteraction[]) => void;
    addInteraction: (interaction: AIInteraction) => void;
    setCurrentResponse: (response: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAIStore = create<AIState>((set) => ({
    interactions: [],
    currentResponse: null,
    isLoading: false,

    setInteractions: (interactions) => set({ interactions }),
    addInteraction: (interaction) =>
        set((state) => ({ interactions: [interaction, ...state.interactions] })),
    setCurrentResponse: (currentResponse) => set({ currentResponse }),
    setLoading: (isLoading) => set({ isLoading }),
}));
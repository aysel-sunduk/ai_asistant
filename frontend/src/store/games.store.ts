// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { GameScore } from '../models/game.model';

interface GamesState {
    scores: GameScore[];
    leaderboard: GameScore[];
    isLoading: boolean;

    setScores: (scores: GameScore[]) => void;
    addScore: (score: GameScore) => void;
    setLeaderboard: (leaderboard: GameScore[]) => void;
    setLoading: (loading: boolean) => void;
}

export const useGamesStore = create<GamesState>((set) => ({
    scores: [],
    leaderboard: [],
    isLoading: false,

    setScores: (scores) => set({ scores }),
    addScore: (score) => set((state) => ({ scores: [score, ...state.scores] })),
    setLeaderboard: (leaderboard) => set({ leaderboard }),
    setLoading: (isLoading) => set({ isLoading }),
}));
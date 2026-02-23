// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback } from 'react';
import { gamesService } from '../../services/games.service';
import type { FrontendGameType } from '../models/game.model';
import { useGamesStore } from '../store/games.store';

export function useGames() {
    const store = useGamesStore();

    const fetchScores = useCallback(async (gameType?: FrontendGameType) => {
        store.setLoading(true);
        try {
            const scores = await gamesService.getScores(gameType);
            store.setScores(scores);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const submitScore = useCallback(async (data: {
        gameType: FrontendGameType;
        score: number;
        level?: number;
        duration?: number;
        difficulty?: string;
        metadata?: Record<string, unknown>;
        createdAt?: string;
    }) => {
        const score = await gamesService.submitScore(data);
        store.addScore(score);
        return score;
    }, []);

    const fetchLeaderboard = useCallback(async (gameType: FrontendGameType) => {
        store.setLoading(true);
        try {
            const leaderboard = await gamesService.getLeaderboard(gameType);
            store.setLeaderboard(leaderboard);
        } finally {
            store.setLoading(false);
        }
    }, []);

    return {
        ...store,
        fetchScores,
        submitScore,
        fetchLeaderboard,
    };
}
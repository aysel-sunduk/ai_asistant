// Kisa aciklama: Servis akislarini yonetir.
import { gamesApi } from '../src/api/games.api';
import type { FrontendGameType, GameRankSummary, GameScore } from '../src/models/game.model';

const toBackendGameType = (gameType: FrontendGameType): string => (gameType === '2048' ? 'quiz' : gameType);

export const gamesService = {
    getScores: async (gameType?: FrontendGameType): Promise<GameScore[]> => {
        const response = await gamesApi.getScores(gameType ? toBackendGameType(gameType) : undefined);
        return response.data;
    },

    submitScore: async (data: {
        gameType: FrontendGameType;
        score: number;
        level?: number;
        duration?: number;
        difficulty?: string;
        metadata?: Record<string, unknown>;
        createdAt?: string;
    }): Promise<GameScore> => {
        const request = {
            ...data,
            gameType: toBackendGameType(data.gameType),
        };

        const response = await gamesApi.submitScore(request);
        return response.data;
    },

    getLeaderboard: async (gameType: FrontendGameType, limit = 50): Promise<GameScore[]> => {
        const response = await gamesApi.getLeaderboard(toBackendGameType(gameType), limit);
        return response.data;
    },

    getRankSummary: async (gameType: FrontendGameType): Promise<GameRankSummary> => {
        const response = await gamesApi.getRankSummary(toBackendGameType(gameType));
        return response.data;
    },
};
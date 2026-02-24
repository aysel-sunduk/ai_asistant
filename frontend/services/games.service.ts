// Kisa aciklama: Servis akislarini yonetir.
import { formatTime, getBestResult, getGameResults, type GameResult } from '../src/utils/game.utils';
import type { FrontendGameType, GameRankSummary, GameScore, PlayerSegmentResponse, PerformanceTrendResponse } from '../src/models/game.model';
import { gamesApi, toBackendGameType } from '../src/api/games.api';

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
    getPlayerSegment: async (gameType: FrontendGameType): Promise<PlayerSegmentResponse> => {
        const response = await gamesApi.getPlayerSegment(toBackendGameType(gameType));
        return response.data.data;
    },
    getPerformanceTrend: async (gameType: FrontendGameType): Promise<PerformanceTrendResponse> => {
        const response = await gamesApi.getPerformanceTrend(toBackendGameType(gameType));
        return response.data.data;
    },
};
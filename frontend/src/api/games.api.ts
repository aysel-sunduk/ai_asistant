import type { GameRankSummary, GameScore } from '../models/game.model';
import apiClient from './client';

export interface SubmitGameScoreRequest {
    gameType: string;
    score: number;
    level?: number;
    duration?: number;
    difficulty?: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
}

export const gamesApi = {
    getScores: (gameType?: string) => apiClient.get<GameScore[]>('/games/scores', {
        params: gameType ? { gameType } : undefined,
    }),
    submitScore: (data: SubmitGameScoreRequest) => apiClient.post<GameScore>('/games/scores', data),
    getLeaderboard: (gameKey: string, limit = 50) =>
        apiClient.get<GameScore[]>(`/games/leaderboard/${gameKey}`, { params: { limit } }),
    getRankSummary: (gameKey: string) =>
        apiClient.get<GameRankSummary>(`/games/rank-summary/${gameKey}`),
};

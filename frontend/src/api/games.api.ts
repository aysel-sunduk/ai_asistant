import type { GameScore } from '../models/game.model';
import apiClient from './client';

export const gamesApi = {
    getScores: (params?: Record<string, unknown>) => apiClient.get<GameScore[]>('/games/scores', { params }),
    submitScore: (data: Partial<GameScore>) => apiClient.post<GameScore>('/games/scores', data),
    getLeaderboard: (gameKey: string) => apiClient.get<GameScore[]>(`/games/leaderboard/${gameKey}`),
};

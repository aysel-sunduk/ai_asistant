import { gamesApi } from '../src/api/games.api';
import type { GameScore } from '../src/models/game.model';

export const gamesService = {
    getScores: async (gameType?: string): Promise<GameScore[]> => {
        const response = await gamesApi.getScores(gameType);
        return response.data;
    },

    submitScore: async (data: Partial<GameScore>): Promise<GameScore> => {
        const response = await gamesApi.submitScore(data);
        return response.data;
    },

    getLeaderboard: async (gameType: string): Promise<GameScore[]> => {
        const response = await gamesApi.getLeaderboard(gameType);
        return response.data;
    },
};

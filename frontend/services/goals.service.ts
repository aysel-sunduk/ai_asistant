import { goalsApi } from '../src/api/goals.api';
import type { Goal, GoalRequest } from '../src/models/goal.model';

export const goalsService = {
    getAll: async (completed?: boolean): Promise<Goal[]> => {
        const response = await goalsApi.getGoals(completed, 0, 100);
        return response.data.data.content || [];
    },

    getById: async (id: string): Promise<Goal> => {
        const response = await goalsApi.getGoal(id);
        return response.data.data;
    },

    create: async (data: GoalRequest): Promise<Goal> => {
        const response = await goalsApi.createGoal(data);
        return response.data.data;
    },

    update: async (id: string, data: GoalRequest): Promise<Goal> => {
        const response = await goalsApi.updateGoal(id, data);
        return response.data.data;
    },

    updateProgress: async (id: string, progressPct: number): Promise<Goal> => {
        const response = await goalsApi.updateProgress(id, progressPct);
        return response.data.data;
    },

    updateCompletion: async (id: string, isCompleted: boolean): Promise<Goal> => {
        const response = await goalsApi.updateCompletion(id, isCompleted);
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await goalsApi.deleteGoal(id);
    },
};

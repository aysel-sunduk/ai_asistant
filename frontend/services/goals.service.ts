import { goalsApi } from '../src/api/goals.api';
import type { Goal } from '../src/models/goal.model';

export const goalsService = {
    getAll: async (): Promise<Goal[]> => {
        const response = await goalsApi.getAll();
        return response.data;
    },

    getById: async (id: string): Promise<Goal> => {
        const response = await goalsApi.getById(id);
        return response.data;
    },

    create: async (data: Partial<Goal>): Promise<Goal> => {
        const response = await goalsApi.create(data);
        return response.data;
    },

    update: async (id: string, data: Partial<Goal>): Promise<Goal> => {
        const response = await goalsApi.update(id, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await goalsApi.delete(id);
    },
};

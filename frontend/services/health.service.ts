// Kisa aciklama: Servis akislarini yonetir.
import { healthApi } from '../src/api/health.api';
import type { HealthGoals, HealthLog } from '../src/models/health.model';

export const healthService = {
    getLogs: async (): Promise<HealthLog[]> => {
        const response = await healthApi.getLogs(0, 200);
        return response.data.data.content || [];
    },

    createLog: async (data: Partial<HealthLog>): Promise<HealthLog> => {
        // Debug: log outgoing payload and response for diagnosis
        // eslint-disable-next-line no-console
        console.log('[healthService] createLog request:', JSON.stringify(data));
        try {
            const response = await healthApi.createLog(data);
            // eslint-disable-next-line no-console
            console.log('[healthService] createLog response:', response?.data);
            return response.data.data;
        } catch (err: any) {
            // eslint-disable-next-line no-console
            console.warn('[healthService] createLog error:', err?.response?.data || err);
            throw err;
        }
    },

    deleteLog: async (id: string): Promise<void> => {
        await healthApi.deleteLog(id);
    },

    getGoals: async (): Promise<HealthGoals> => {
        const response = await healthApi.getGoals();
        return response.data.data;
    },

    updateGoals: async (data: Pick<HealthGoals, 'waterMlTarget' | 'stepsTarget'>): Promise<HealthGoals> => {
        const response = await healthApi.updateGoals(data);
        return response.data.data;
    },

    getDailySummary: async (date: string): Promise<HealthLog[]> => {
        const logs = await healthService.getLogs();
        return logs.filter((log: HealthLog) => log.logDate === date);
    },

    getDailyNutrition: async (date: string) => {
        const response = await healthApi.getDailyNutrition(date);
        return response.data.data;
    },
    
    getDietRecommendation: async (data: { calorieTarget?: number; dietGoal?: string; allergies?: string[]; preference?: string; excludedFoods?: string[] }) => {
        const response = await healthApi.getDietRecommendation(data);
        return response.data.data;
    },

    mealSwap: async (data: { slot: string; calorieTarget?: number; dietGoal?: string; excludedRecipeIds?: number[]; preference?: string }) => {
        const response = await healthApi.mealSwap(data);
        return response.data.data;
    },
    
    toggleFavorite: async (id: string): Promise<HealthLog> => {
        const response = await healthApi.toggleFavorite(id);
        return response.data.data;
    },

    toggleFavoriteMeal: async (foodName: string): Promise<string[]> => {
        const response = await healthApi.toggleFavoriteMeal(foodName);
        return response.data.data;
    },
};
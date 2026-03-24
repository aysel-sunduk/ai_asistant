// Kisa aciklama: Backend API cagrilarini toplar.
import type { HealthGoals, HealthLog } from '../models/health.model';
import type { ApiResponse } from '../models/auth.model';
import type { PageResponse } from '../models/finance.model';
import apiClient from './client';

export const healthApi = {
    getLogs: (page = 0, size = 100, sortBy = 'loggedAt', sortDirection: 'ASC' | 'DESC' = 'DESC') =>
        apiClient.get<ApiResponse<PageResponse<HealthLog>>>('/v1/health/logs', {
            params: { page, size, sortBy, sortDirection },
        }),
    createLog: (data: Partial<HealthLog>) => apiClient.post<ApiResponse<HealthLog>>('/v1/health/logs', data),
    deleteLog: (id: string) => apiClient.delete<ApiResponse<void>>(`/v1/health/logs/${id}`),
    getGoals: () => apiClient.get<ApiResponse<HealthGoals>>('/v1/health/goals'),
    updateGoals: (data: Pick<HealthGoals, 'waterMlTarget' | 'stepsTarget'>) =>
        apiClient.put<ApiResponse<HealthGoals>>('/v1/health/goals', data),
    getDailyNutrition: (date: string) =>
        apiClient.get<ApiResponse<{ totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number }>>('/v1/health/logs/daily-nutrition', {
            params: { date }
        }),
    getDietRecommendation: (data: { calorieTarget?: number; dietGoal?: string; allergies?: string[]; preference?: string; excludedFoods?: string[] }) =>
        apiClient.post<ApiResponse<any>>('/v1/health/diet/recommend', data),
    mealSwap: (data: { slot: string; calorieTarget?: number; dietGoal?: string; excludedRecipeIds?: number[]; preference?: string }) =>
        apiClient.post<ApiResponse<any>>('/v1/health/diet/meal-swap', data),
};
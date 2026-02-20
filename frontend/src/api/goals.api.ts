import type { ApiResponse } from '../models/auth.model';
import type { Goal, GoalPage, GoalRequest } from '../models/goal.model';
import apiClient from './client';

const BASE_PATH = '/v1/goals';

export const goalsApi = {
    getGoals: (completed?: boolean, page = 0, size = 50, sortBy = 'updatedAt', sortDirection: 'ASC' | 'DESC' = 'DESC') =>
        apiClient.get<ApiResponse<GoalPage>>(BASE_PATH, {
            params: { completed, page, size, sortBy, sortDirection },
        }),
    getGoal: (id: string) => apiClient.get<ApiResponse<Goal>>(`${BASE_PATH}/${id}`),
    createGoal: (data: GoalRequest) => apiClient.post<ApiResponse<Goal>>(BASE_PATH, data),
    updateGoal: (id: string, data: GoalRequest) => apiClient.put<ApiResponse<Goal>>(`${BASE_PATH}/${id}`, data),
    updateProgress: (id: string, progressPct: number) =>
        apiClient.patch<ApiResponse<Goal>>(`${BASE_PATH}/${id}/progress`, { progressPct }),
    updateCompletion: (id: string, isCompleted: boolean) =>
        apiClient.patch<ApiResponse<Goal>>(`${BASE_PATH}/${id}/completion`, { isCompleted }),
    deleteGoal: (id: string) => apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/${id}`),
};

import type { Goal } from '../models/goal.model';
import apiClient from './client';

export const goalsApi = {
    getGoals: () => apiClient.get<Goal[]>('/goals'),
    getGoal: (id: string) => apiClient.get<Goal>(`/goals/${id}`),
    createGoal: (data: Partial<Goal>) => apiClient.post<Goal>('/goals', data),
    updateGoal: (id: string, data: Partial<Goal>) => apiClient.put<Goal>(`/goals/${id}`, data),
    deleteGoal: (id: string) => apiClient.delete(`/goals/${id}`),
};

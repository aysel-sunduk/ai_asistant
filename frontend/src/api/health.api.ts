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
};

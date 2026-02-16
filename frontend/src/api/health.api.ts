import type { HealthLog } from '../models/health.model';
import apiClient from './client';

export const healthApi = {
    getLogs: (params?: Record<string, unknown>) => apiClient.get<HealthLog[]>('/health/logs', { params }),
    createLog: (data: Partial<HealthLog>) => apiClient.post<HealthLog>('/health/logs', data),
    deleteLog: (id: string) => apiClient.delete(`/health/logs/${id}`),
};

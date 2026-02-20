import { healthApi } from '../src/api/health.api';
import type { HealthGoals, HealthLog } from '../src/models/health.model';

export const healthService = {
    getLogs: async (): Promise<HealthLog[]> => {
        const response = await healthApi.getLogs(0, 200);
        return response.data.data.content || [];
    },

    createLog: async (data: Partial<HealthLog>): Promise<HealthLog> => {
        const response = await healthApi.createLog(data);
        return response.data.data;
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
};

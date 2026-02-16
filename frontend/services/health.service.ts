import { healthApi } from '../src/api/health.api';
import type { HealthLog } from '../src/models/health.model';

export const healthService = {
    getLogs: async (type?: string): Promise<HealthLog[]> => {
        const response = await healthApi.getLogs(type);
        return response.data;
    },

    createLog: async (data: Partial<HealthLog>): Promise<HealthLog> => {
        const response = await healthApi.createLog(data);
        return response.data;
    },

    getDailySummary: async (date: string): Promise<HealthLog[]> => {
        const response = await healthApi.getLogs(undefined);
        // TODO: Backend'den gün bazlı filtreleme
        return response.data.filter((log: HealthLog) => log.date === date);
    },
};

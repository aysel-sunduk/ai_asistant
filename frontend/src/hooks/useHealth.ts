import { useCallback } from 'react';
import { healthService } from '../../services/health.service';
import type { HealthLog } from '../models/health.model';
import { useHealthStore } from '../store/health.store';

export function useHealth() {
    const store = useHealthStore();

    const fetchLogs = useCallback(async (type?: string) => {
        store.setLoading(true);
        try {
            const logs = await healthService.getLogs(type);
            store.setLogs(logs);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createLog = useCallback(async (data: Partial<HealthLog>) => {
        const log = await healthService.createLog(data);
        store.addLog(log);
        return log;
    }, []);

    return {
        ...store,
        fetchLogs,
        createLog,
    };
}

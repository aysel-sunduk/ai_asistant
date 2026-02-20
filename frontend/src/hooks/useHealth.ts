import { useCallback } from 'react';
import { healthService } from '../../services/health.service';
import type { HealthLog } from '../models/health.model';
import { useHealthStore } from '../store/health.store';

export function useHealth() {
    const logs = useHealthStore((s) => s.logs);
    const isLoading = useHealthStore((s) => s.isLoading);
    const selectedDate = useHealthStore((s) => s.selectedDate);
    const setLogs = useHealthStore((s) => s.setLogs);
    const addLog = useHealthStore((s) => s.addLog);
    const removeLog = useHealthStore((s) => s.removeLog);
    const setLoading = useHealthStore((s) => s.setLoading);
    const setSelectedDate = useHealthStore((s) => s.setSelectedDate);
    const getLogsByType = useHealthStore((s) => s.getLogsByType);
    const getTodayLogs = useHealthStore((s) => s.getTodayLogs);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const nextLogs = await healthService.getLogs();
            setLogs(nextLogs);
        } catch (error) {
            // Keep the last successful data on transient API/auth errors.
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setLogs]);

    const createLog = useCallback(async (data: Partial<HealthLog>) => {
        const log = await healthService.createLog(data);
        addLog(log);
        return log;
    }, [addLog]);

    const deleteLog = useCallback(async (id: string) => {
        await healthService.deleteLog(id);
        removeLog(id);
    }, [removeLog]);

    return {
        logs,
        isLoading,
        selectedDate,
        setSelectedDate,
        getLogsByType,
        getTodayLogs,
        fetchLogs,
        createLog,
        deleteLog,
    };
}

import { useCallback } from 'react';
import { goalsService } from '../../services/goals.service';
import type { Goal } from '../models/goal.model';
import { useGoalsStore } from '../store/goals.store';

export function useGoals() {
    const store = useGoalsStore();

    const fetchGoals = useCallback(async () => {
        store.setLoading(true);
        try {
            const goals = await goalsService.getAll();
            store.setGoals(goals);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createGoal = useCallback(async (data: Partial<Goal>) => {
        const goal = await goalsService.create(data);
        store.addGoal(goal);
        return goal;
    }, []);

    const updateGoal = useCallback(async (id: string, data: Partial<Goal>) => {
        const goal = await goalsService.update(id, data);
        store.updateGoal(goal);
        return goal;
    }, []);

    const deleteGoal = useCallback(async (id: string) => {
        await goalsService.delete(id);
        store.removeGoal(id);
    }, []);

    return {
        ...store,
        fetchGoals,
        createGoal,
        updateGoal,
        deleteGoal,
    };
}

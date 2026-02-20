import { useCallback } from 'react';
import { goalsService } from '../../services/goals.service';
import type { GoalRequest } from '../models/goal.model';
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

    const fetchGoalById = useCallback(async (id: string) => {
        store.setLoading(true);
        try {
            const goal = await goalsService.getById(id);
            store.setSelectedGoal(goal);
            return goal;
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createGoal = useCallback(async (data: GoalRequest) => {
        const goal = await goalsService.create(data);
        store.addGoal(goal);
        return goal;
    }, []);

    const updateGoal = useCallback(async (id: string, data: GoalRequest) => {
        const goal = await goalsService.update(id, data);
        store.updateGoal(goal);
        store.setSelectedGoal(goal);
        return goal;
    }, []);

    const updateProgress = useCallback(async (id: string, progressPct: number) => {
        const goal = await goalsService.updateProgress(id, progressPct);
        store.updateGoal(goal);
        store.setSelectedGoal(goal);
        return goal;
    }, []);

    const updateCompletion = useCallback(async (id: string, isCompleted: boolean) => {
        const goal = await goalsService.updateCompletion(id, isCompleted);
        store.updateGoal(goal);
        store.setSelectedGoal(goal);
        return goal;
    }, []);

    const deleteGoal = useCallback(async (id: string) => {
        await goalsService.delete(id);
        store.removeGoal(id);
    }, []);

    return {
        ...store,
        fetchGoals,
        fetchGoalById,
        createGoal,
        updateGoal,
        updateProgress,
        updateCompletion,
        deleteGoal,
    };
}

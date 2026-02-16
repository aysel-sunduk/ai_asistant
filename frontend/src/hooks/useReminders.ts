import { useCallback } from 'react';
import { remindersService } from '../../services/reminders.service';
import type { Reminder } from '../models/reminder.model';
import { useRemindersStore } from '../store/reminders.store';

export function useReminders() {
    const store = useRemindersStore();

    const fetchReminders = useCallback(async () => {
        store.setLoading(true);
        try {
            const reminders = await remindersService.getAll();
            store.setReminders(reminders);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createReminder = useCallback(async (data: Partial<Reminder>) => {
        const reminder = await remindersService.create(data);
        store.addReminder(reminder);
        return reminder;
    }, []);

    const updateReminder = useCallback(async (id: string, data: Partial<Reminder>) => {
        const reminder = await remindersService.update(id, data);
        store.updateReminder(reminder);
        return reminder;
    }, []);

    const deleteReminder = useCallback(async (id: string) => {
        await remindersService.delete(id);
        store.removeReminder(id);
    }, []);

    return {
        ...store,
        fetchReminders,
        createReminder,
        updateReminder,
        deleteReminder,
    };
}

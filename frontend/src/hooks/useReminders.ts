import { useCallback } from 'react';
import { remindersService } from '../../services/reminders.service';
import type { ReminderRequest, ReminderStatus } from '../models/reminder.model';
import { useRemindersStore } from '../store/reminders.store';

export function useReminders() {
    const store = useRemindersStore();

    const fetchReminders = useCallback(async () => {
        store.setLoading(true);
        try {
            const page = await remindersService.getAll();
            store.setReminders(page.content);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createReminder = useCallback(async (data: ReminderRequest) => {
        const reminder = await remindersService.create(data);
        store.addReminder(reminder);
        return reminder;
    }, []);

    const updateReminder = useCallback(async (id: string, data: ReminderRequest) => {
        const reminder = await remindersService.update(id, data);
        store.updateReminder(reminder);
        return reminder;
    }, []);

    const updateReminderStatus = useCallback(async (id: string, status: ReminderStatus) => {
        const reminder = await remindersService.updateStatus(id, status);
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
        updateReminderStatus,
        deleteReminder,
    };
}

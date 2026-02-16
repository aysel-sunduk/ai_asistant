import { remindersApi } from '../src/api/reminders.api';
import type { Reminder } from '../src/models/reminder.model';

export const remindersService = {
    getAll: async (): Promise<Reminder[]> => {
        const response = await remindersApi.getAll();
        return response.data;
    },

    create: async (data: Partial<Reminder>): Promise<Reminder> => {
        const response = await remindersApi.create(data);
        return response.data;
    },

    update: async (id: string, data: Partial<Reminder>): Promise<Reminder> => {
        const response = await remindersApi.update(id, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await remindersApi.delete(id);
    },

    toggleComplete: async (id: string): Promise<Reminder> => {
        const response = await remindersApi.toggleComplete(id);
        return response.data;
    },
};

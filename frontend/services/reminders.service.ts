// Kisa aciklama: Servis akislarini yonetir.
import { remindersApi } from '../src/api/reminders.api';
import type {
    Reminder,
    ReminderPage,
    ReminderRequest,
    ReminderStatus,
} from '../src/models/reminder.model';

export const remindersService = {
    getAll: async (page = 0, size = 50): Promise<ReminderPage> => {
        const response = await remindersApi.getReminders(page, size, 'remindAt', 'ASC');
        return response.data.data;
    },

    getById: async (id: string): Promise<Reminder> => {
        const response = await remindersApi.getReminder(id);
        return response.data.data;
    },

    getScheduled: async (): Promise<Reminder[]> => {
        const response = await remindersApi.getScheduledReminders();
        return response.data.data;
    },

    getNotifications: async (withinMinutes = 1440): Promise<Reminder[]> => {
        const response = await remindersApi.getNotificationFeed(withinMinutes);
        return response.data.data;
    },

    getByDateRange: async (startDate: string, endDate: string): Promise<Reminder[]> => {
        const response = await remindersApi.getRemindersByDateRange(startDate, endDate);
        return response.data.data;
    },

    create: async (data: ReminderRequest): Promise<Reminder> => {
        const response = await remindersApi.createReminder(data);
        return response.data.data;
    },

    update: async (id: string, data: ReminderRequest): Promise<Reminder> => {
        const response = await remindersApi.updateReminder(id, data);
        return response.data.data;
    },

    updateStatus: async (id: string, status: ReminderStatus): Promise<Reminder> => {
        const response = await remindersApi.updateReminderStatus(id, status);
        return response.data.data;
    },

    dismissNotification: async (id: string): Promise<Reminder> => {
        const response = await remindersApi.dismissNotification(id);
        return response.data.data;
    },

    clearNotifications: async (withinMinutes = 1440): Promise<void> => {
        await remindersApi.clearNotifications(withinMinutes);
    },

    delete: async (id: string): Promise<void> => {
        await remindersApi.deleteReminder(id);
    },
};
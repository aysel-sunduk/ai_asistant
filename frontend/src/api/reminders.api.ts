import type { Reminder } from '../models/reminder.model';
import apiClient from './client';

export const remindersApi = {
    getReminders: (params?: Record<string, unknown>) => apiClient.get<Reminder[]>('/reminders', { params }),
    createReminder: (data: Partial<Reminder>) => apiClient.post<Reminder>('/reminders', data),
    updateReminder: (id: string, data: Partial<Reminder>) => apiClient.put<Reminder>(`/reminders/${id}`, data),
    deleteReminder: (id: string) => apiClient.delete(`/reminders/${id}`),
};

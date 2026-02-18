import type { ApiResponse } from '../models/auth.model';
import type { Reminder, ReminderPage, ReminderRequest, ReminderStatus } from '../models/reminder.model';
import apiClient from './client';

const BASE_PATH = '/v1/business/reminders';

export const remindersApi = {
    getReminders: (page = 0, size = 50, sortBy = 'remindAt', sortDirection: 'ASC' | 'DESC' = 'ASC') =>
        apiClient.get<ApiResponse<ReminderPage>>(BASE_PATH, {
            params: { page, size, sortBy, sortDirection },
        }),

    getReminder: (id: string) =>
        apiClient.get<ApiResponse<Reminder>>(`${BASE_PATH}/${id}`),

    createReminder: (data: ReminderRequest) =>
        apiClient.post<ApiResponse<Reminder>>(BASE_PATH, data),

    updateReminder: (id: string, data: ReminderRequest) =>
        apiClient.put<ApiResponse<Reminder>>(`${BASE_PATH}/${id}`, data),

    updateReminderStatus: (id: string, status: ReminderStatus) =>
        apiClient.patch<ApiResponse<Reminder>>(`${BASE_PATH}/${id}/status`, null, {
            params: { status },
        }),

    getScheduledReminders: () =>
        apiClient.get<ApiResponse<Reminder[]>>(`${BASE_PATH}/scheduled`),

    getNotificationFeed: (withinMinutes = 1440) =>
        apiClient.get<ApiResponse<Reminder[]>>(`${BASE_PATH}/notifications`, {
            params: { withinMinutes },
        }),

    getRemindersByDateRange: (startDate: string, endDate: string) =>
        apiClient.get<ApiResponse<Reminder[]>>(`${BASE_PATH}/date-range`, {
            params: { startDate, endDate },
        }),

    dismissNotification: (id: string) =>
        apiClient.patch<ApiResponse<Reminder>>(`${BASE_PATH}/notifications/${id}/dismiss`),

    clearNotifications: (withinMinutes = 1440) =>
        apiClient.patch<ApiResponse<void>>(`${BASE_PATH}/notifications/clear-all`, null, {
            params: { withinMinutes },
        }),

    deleteReminder: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/${id}`),
};

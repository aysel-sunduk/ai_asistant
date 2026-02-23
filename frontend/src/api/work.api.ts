// Kisa aciklama: Backend API cagrilarini toplar.
import type { ApiResponse } from '../models/auth.model';
import type {
    WorkEvent,
    WorkEventRequest,
    WorkEventsPage,
    WorkEventsSummary,
} from '../models/work.model';
import apiClient from './client';

const BASE_PATH = '/v1/business/events';

export const workApi = {
    getEvents: (params?: Record<string, unknown>) =>
        apiClient.get<ApiResponse<WorkEventsPage>>(BASE_PATH, { params }),

    getEvent: (id: string) =>
        apiClient.get<ApiResponse<WorkEvent>>(`${BASE_PATH}/${id}`),

    createEvent: (data: WorkEventRequest) =>
        apiClient.post<ApiResponse<WorkEvent>>(BASE_PATH, data),

    updateEvent: (id: string, data: WorkEventRequest) =>
        apiClient.put<ApiResponse<WorkEvent>>(`${BASE_PATH}/${id}`, data),

    updateEventStatus: (id: string, status: string) =>
        apiClient.patch<ApiResponse<WorkEvent>>(`${BASE_PATH}/${id}/status`, null, {
            params: { status },
        }),

    deleteEvent: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/${id}`),

    getEventsByDateRange: (startDate: string, endDate: string) =>
        apiClient.get<ApiResponse<WorkEvent[]>>(`${BASE_PATH}/date-range`, {
            params: { startDate, endDate },
        }),

    getUpcomingEvents: () =>
        apiClient.get<ApiResponse<WorkEvent[]>>(`${BASE_PATH}/upcoming`),

    getOngoingEvents: () =>
        apiClient.get<ApiResponse<WorkEvent[]>>(`${BASE_PATH}/ongoing`),

    getTodayEvents: () =>
        apiClient.get<ApiResponse<WorkEvent[]>>(`${BASE_PATH}/today`),

    getThisWeekEvents: () =>
        apiClient.get<ApiResponse<WorkEvent[]>>(`${BASE_PATH}/this-week`),

    getEventsByStatus: (status: string, page = 0, size = 10) =>
        apiClient.get<ApiResponse<WorkEventsPage>>(`${BASE_PATH}/by-status`, {
            params: { status, page, size },
        }),

    getEventsByPriority: (priority: string) =>
        apiClient.get<ApiResponse<WorkEvent[]>>(`${BASE_PATH}/by-priority`, {
            params: { priority },
        }),

    getEventsByType: (eventType: string, page = 0, size = 10) =>
        apiClient.get<ApiResponse<WorkEventsPage>>(`${BASE_PATH}/by-type`, {
            params: { eventType, page, size },
        }),

    getOnlineEvents: (page = 0, size = 10) =>
        apiClient.get<ApiResponse<WorkEventsPage>>(`${BASE_PATH}/online`, {
            params: { page, size },
        }),

    getPastEvents: (page = 0, size = 10) =>
        apiClient.get<ApiResponse<WorkEventsPage>>(`${BASE_PATH}/past`, {
            params: { page, size },
        }),

    searchEvents: (query: string, page = 0, size = 10) =>
        apiClient.get<ApiResponse<WorkEventsPage>>(`${BASE_PATH}/search`, {
            params: { query, page, size },
        }),

    getEventsSummary: () =>
        apiClient.get<ApiResponse<WorkEventsSummary>>(`${BASE_PATH}/summary`),
};
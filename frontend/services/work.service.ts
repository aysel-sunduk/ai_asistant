// Kisa aciklama: Servis akislarini yonetir.
import { workApi } from '../src/api/work.api';
import type {
    WorkEvent,
    WorkEventRequest,
    WorkEventsPage,
    WorkEventsSummary,
} from '../src/models/work.model';

export const workService = {
    getEvents: async (params?: Record<string, unknown>): Promise<WorkEvent[]> => {
        const response = await workApi.getEvents(params);
        return response.data.data.content;
    },

    getEventsPage: async (params?: Record<string, unknown>): Promise<WorkEventsPage> => {
        const response = await workApi.getEvents(params);
        return response.data.data;
    },

    getEvent: async (id: string): Promise<WorkEvent> => {
        const response = await workApi.getEvent(id);
        return response.data.data;
    },

    createEvent: async (data: Partial<WorkEvent> | WorkEventRequest): Promise<WorkEvent> => {
        const response = await workApi.createEvent(data as WorkEventRequest);
        return response.data.data;
    },

    updateEvent: async (id: string, data: Partial<WorkEvent> | WorkEventRequest): Promise<WorkEvent> => {
        const response = await workApi.updateEvent(id, data as WorkEventRequest);
        return response.data.data;
    },

    updateEventStatus: async (id: string, status: string): Promise<WorkEvent> => {
        const response = await workApi.updateEventStatus(id, status);
        return response.data.data;
    },

    deleteEvent: async (id: string): Promise<void> => {
        await workApi.deleteEvent(id);
    },

    getEventsByDateRange: async (startDate: string, endDate: string): Promise<WorkEvent[]> => {
        const response = await workApi.getEventsByDateRange(startDate, endDate);
        return response.data.data;
    },

    getUpcomingEvents: async (): Promise<WorkEvent[]> => {
        const response = await workApi.getUpcomingEvents();
        return response.data.data;
    },

    getOngoingEvents: async (): Promise<WorkEvent[]> => {
        const response = await workApi.getOngoingEvents();
        return response.data.data;
    },

    getTodayEvents: async (): Promise<WorkEvent[]> => {
        const response = await workApi.getTodayEvents();
        return response.data.data;
    },

    getThisWeekEvents: async (): Promise<WorkEvent[]> => {
        const response = await workApi.getThisWeekEvents();
        return response.data.data;
    },

    getEventsByStatus: async (status: string, page = 0, size = 10): Promise<WorkEventsPage> => {
        const response = await workApi.getEventsByStatus(status, page, size);
        return response.data.data;
    },

    getEventsByPriority: async (priority: string): Promise<WorkEvent[]> => {
        const response = await workApi.getEventsByPriority(priority);
        return response.data.data;
    },

    getEventsByType: async (eventType: string, page = 0, size = 10): Promise<WorkEventsPage> => {
        const response = await workApi.getEventsByType(eventType, page, size);
        return response.data.data;
    },

    getOnlineEvents: async (page = 0, size = 10): Promise<WorkEventsPage> => {
        const response = await workApi.getOnlineEvents(page, size);
        return response.data.data;
    },

    getPastEvents: async (page = 0, size = 10): Promise<WorkEventsPage> => {
        const response = await workApi.getPastEvents(page, size);
        return response.data.data;
    },

    searchEvents: async (query: string, page = 0, size = 10): Promise<WorkEventsPage> => {
        const response = await workApi.searchEvents(query, page, size);
        return response.data.data;
    },

    getEventsSummary: async (): Promise<WorkEventsSummary> => {
        const response = await workApi.getEventsSummary();
        return response.data.data;
    },
};
import type { WorkEvent } from '../models/work.model';
import apiClient from './client';

export const workApi = {
    getEvents: (params?: Record<string, unknown>) => apiClient.get<WorkEvent[]>('/work/events', { params }),
    getEvent: (id: string) => apiClient.get<WorkEvent>(`/work/events/${id}`),
    createEvent: (data: Partial<WorkEvent>) => apiClient.post<WorkEvent>('/work/events', data),
    updateEvent: (id: string, data: Partial<WorkEvent>) => apiClient.put<WorkEvent>(`/work/events/${id}`, data),
    deleteEvent: (id: string) => apiClient.delete(`/work/events/${id}`),
};

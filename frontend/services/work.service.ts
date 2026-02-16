import { workApi } from '../src/api/work.api';
import type { WorkEvent } from '../src/models/work.model';

export const workService = {
    getEvents: async (): Promise<WorkEvent[]> => {
        const response = await workApi.getEvents();
        return response.data;
    },

    getEvent: async (id: string): Promise<WorkEvent> => {
        const response = await workApi.getEvent(id);
        return response.data;
    },

    createEvent: async (data: Partial<WorkEvent>): Promise<WorkEvent> => {
        const response = await workApi.createEvent(data);
        return response.data;
    },

    updateEvent: async (id: string, data: Partial<WorkEvent>): Promise<WorkEvent> => {
        const response = await workApi.updateEvent(id, data);
        return response.data;
    },

    deleteEvent: async (id: string): Promise<void> => {
        await workApi.deleteEvent(id);
    },
};

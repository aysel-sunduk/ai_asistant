// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback } from 'react';
import { workService } from '../../services/work.service';
import type { WorkEvent } from '../models/work.model';
import { useWorkStore } from '../store/work.store';

export function useWork() {
    const store = useWorkStore();

    const fetchEvents = useCallback(async () => {
        store.setLoading(true);
        try {
            const events = await workService.getEvents();
            store.setEvents(events);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createEvent = useCallback(async (data: Partial<WorkEvent>) => {
        const event = await workService.createEvent(data);
        store.addEvent(event);
        return event;
    }, []);

    const updateEvent = useCallback(async (id: string, data: Partial<WorkEvent>) => {
        const event = await workService.updateEvent(id, data);
        store.updateEvent(event);
        return event;
    }, []);

    const deleteEvent = useCallback(async (id: string) => {
        await workService.deleteEvent(id);
        store.removeEvent(id);
    }, []);

    return {
        ...store,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
    };
}
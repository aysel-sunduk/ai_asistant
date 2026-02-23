// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { WorkEvent } from '../models/work.model';

interface WorkState {
    events: WorkEvent[];
    selectedEvent: WorkEvent | null;
    isLoading: boolean;

    setEvents: (events: WorkEvent[]) => void;
    setSelectedEvent: (event: WorkEvent | null) => void;
    addEvent: (event: WorkEvent) => void;
    updateEvent: (event: WorkEvent) => void;
    removeEvent: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useWorkStore = create<WorkState>((set) => ({
    events: [],
    selectedEvent: null,
    isLoading: false,

    setEvents: (events) => set({ events }),
    setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
    addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
    updateEvent: (event) =>
        set((state) => ({
            events: state.events.map((e) => (e.id === event.id ? event : e)),
        })),
    removeEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
}));
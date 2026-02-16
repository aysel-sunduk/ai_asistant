import { create } from 'zustand';
import type { Reminder } from '../models/reminder.model';

interface RemindersState {
    reminders: Reminder[];
    isLoading: boolean;

    setReminders: (reminders: Reminder[]) => void;
    addReminder: (reminder: Reminder) => void;
    updateReminder: (reminder: Reminder) => void;
    removeReminder: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useRemindersStore = create<RemindersState>((set) => ({
    reminders: [],
    isLoading: false,

    setReminders: (reminders) => set({ reminders }),
    addReminder: (reminder) =>
        set((state) => ({ reminders: [reminder, ...state.reminders] })),
    updateReminder: (reminder) =>
        set((state) => ({
            reminders: state.reminders.map((r) => (r.id === reminder.id ? reminder : r)),
        })),
    removeReminder: (id) =>
        set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) })),
    setLoading: (isLoading) => set({ isLoading }),
}));

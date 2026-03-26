import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'app_theme_mode';

interface ThemeState {
    mode: ThemeMode;
    isLoaded: boolean;
    loadMode: () => Promise<void>;
    setMode: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: 'system',
    isLoaded: false,

    loadMode: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                set({ mode: stored, isLoaded: true });
                return;
            }
        } catch {
            // noop
        }
        set({ isLoaded: true });
    },

    setMode: async (mode) => {
        set({ mode });
        try {
            await AsyncStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // noop
        }
    },
}));

export const resolveTheme = (mode: ThemeMode, systemScheme: 'light' | 'dark') =>
    mode === 'system' ? systemScheme : mode;

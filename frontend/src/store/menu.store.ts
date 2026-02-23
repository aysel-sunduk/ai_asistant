// Kisa aciklama: Uygulama state yonetimini yapar.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface MenuModule {
    id: string;
    title: string;
    icon: string;
    color: string;
    route: string;
}

const DEFAULT_MODULES: MenuModule[] = [
    { id: 'work', title: 'İş', icon: 'briefcase', color: '#5B8DEF', route: '/(work)/events' },
    { id: 'family', title: 'Aile', icon: 'people', color: '#FF8A65', route: '/(family)/contacts' },
    { id: 'finance', title: 'Finans', icon: 'wallet', color: '#4ECDC4', route: '/(tabs)/finance' },
    { id: 'goals', title: 'Hedefler', icon: 'trophy', color: '#FFD93D', route: '/(goals)/goals' },
    { id: 'games', title: 'Oyun', icon: 'game-controller', color: '#A78BFA', route: '/(games)/game-list' },
    { id: 'health', title: 'Sağlık', icon: 'heart', color: '#FF6B6B', route: '/(tabs)/health' },
    { id: 'shopping', title: 'Alışveriş', icon: 'cart', color: '#F472B6', route: '/(shopping)/lists' },
    { id: 'reminders', title: 'Hatırlatıcılar', icon: 'alarm', color: '#60A5FA', route: '/(reminders)/reminders' },
    { id: 'social', title: 'Sosyal', icon: 'chatbubbles', color: '#34D399', route: '/(social)/feed' },
    { id: 'blog', title: 'Blog', icon: 'book', color: '#6C63FF', route: '/(blog)/create-post' },
    { id: 'profile', title: 'Profil', icon: 'person-circle', color: '#9BA1A6', route: '/(tabs)/profile' },
];

const STORAGE_KEY = 'menu_module_order';
const SHORTCUTS_STORAGE_KEY = 'menu_shortcuts';
const DEFAULT_SHORTCUTS = ['finance', 'health', 'blog'];

interface MenuState {
    modules: MenuModule[];
    shortcuts: string[];
    isLoaded: boolean;
    loadOrder: () => Promise<void>;
    toggleShortcut: (id: string) => void;
    moveUp: (index: number) => void;
    moveDown: (index: number) => void;
    resetOrder: () => void;
}

const saveOrder = async (modules: MenuModule[]) => {
    try {
        const ids = modules.map((m) => m.id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        // silent
    }
};

const saveShortcuts = async (shortcuts: string[]) => {
    try {
        await AsyncStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
    } catch {
        // silent
    }
};

export const useMenuStore = create<MenuState>((set, get) => ({
    modules: DEFAULT_MODULES,
    shortcuts: DEFAULT_SHORTCUTS,
    isLoaded: false,

    loadOrder: async () => {
        try {
            const [stored, storedShortcuts] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY),
                AsyncStorage.getItem(SHORTCUTS_STORAGE_KEY),
            ]);

            let modules = DEFAULT_MODULES;
            if (stored) {
                const ids: string[] = JSON.parse(stored);
                const lookup = new Map(DEFAULT_MODULES.map((m) => [m.id, m]));
                const ordered: MenuModule[] = [];
                for (const id of ids) {
                    const mod = lookup.get(id);
                    if (mod) {
                        ordered.push(mod);
                        lookup.delete(id);
                    }
                }
                // Append any new modules not in saved order
                for (const mod of lookup.values()) {
                    ordered.push(mod);
                }
                modules = ordered;
            }

            const moduleIds = new Set(modules.map((m) => m.id));
            let shortcuts = DEFAULT_SHORTCUTS.filter((id) => moduleIds.has(id));
            if (storedShortcuts) {
                const parsed = JSON.parse(storedShortcuts);
                if (Array.isArray(parsed)) {
                    shortcuts = parsed
                        .filter((id): id is string => typeof id === 'string')
                        .filter((id) => moduleIds.has(id))
                        .slice(0, 3);
                }
            }

            set({ modules, shortcuts, isLoaded: true });
        } catch {
            set({ shortcuts: DEFAULT_SHORTCUTS, isLoaded: true });
        }
    },

    toggleShortcut: (id: string) => {
        const moduleIds = new Set(get().modules.map((m) => m.id));
        if (!moduleIds.has(id)) return;

        const current = get().shortcuts;
        let next: string[];
        if (current.includes(id)) {
            next = current.filter((s) => s !== id);
        } else {
            next = [...current, id].slice(0, 3);
        }
        set({ shortcuts: next });
        saveShortcuts(next);
    },

    moveUp: (index: number) => {
        if (index <= 0) return;
        const modules = [...get().modules];
        [modules[index - 1], modules[index]] = [modules[index], modules[index - 1]];
        set({ modules });
        saveOrder(modules);
    },

    moveDown: (index: number) => {
        const modules = [...get().modules];
        if (index >= modules.length - 1) return;
        [modules[index], modules[index + 1]] = [modules[index + 1], modules[index]];
        set({ modules });
        saveOrder(modules);
    },

    resetOrder: () => {
        set({ modules: DEFAULT_MODULES, shortcuts: DEFAULT_SHORTCUTS });
        saveOrder(DEFAULT_MODULES);
        saveShortcuts(DEFAULT_SHORTCUTS);
    },
}));
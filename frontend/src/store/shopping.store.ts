import { create } from 'zustand';
import type { ShoppingItem, ShoppingList } from '../models/shopping.model';

interface ShoppingState {
    lists: ShoppingList[];
    selectedListItems: ShoppingItem[];
    isLoading: boolean;

    setLists: (lists: ShoppingList[]) => void;
    addList: (list: ShoppingList) => void;
    updateList: (list: ShoppingList) => void;
    removeList: (id: string) => void;
    setSelectedListItems: (items: ShoppingItem[]) => void;
    addItem: (item: ShoppingItem) => void;
    updateItem: (item: ShoppingItem) => void;
    toggleItem: (itemId: string) => void;
    removeItem: (itemId: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useShoppingStore = create<ShoppingState>((set) => ({
    lists: [],
    selectedListItems: [],
    isLoading: false,

    setLists: (lists) => set({ lists }),
    addList: (list) => set((state) => ({ lists: [list, ...state.lists] })),
    updateList: (list) =>
        set((state) => ({
            lists: state.lists.map((l) => (l.id === list.id ? list : l)),
        })),
    removeList: (id) =>
        set((state) => ({ lists: state.lists.filter((l) => l.id !== id) })),
    setSelectedListItems: (selectedListItems) => set({ selectedListItems }),
    addItem: (item) =>
        set((state) => ({ selectedListItems: [...state.selectedListItems, item] })),
    updateItem: (item) =>
        set((state) => ({
            selectedListItems: state.selectedListItems.map((i) => (i.id === item.id ? item : i)),
        })),
    toggleItem: (itemId) =>
        set((state) => ({
            selectedListItems: state.selectedListItems.map((i) =>
                i.id === itemId ? { ...i, isChecked: !i.isChecked } : i,
            ),
        })),
    removeItem: (itemId) =>
        set((state) => ({
            selectedListItems: state.selectedListItems.filter((i) => i.id !== itemId),
        })),
    setLoading: (isLoading) => set({ isLoading }),
}));

import { useCallback } from 'react';
import { shoppingService } from '../../services/shopping.service';
import type { ShoppingItem, ShoppingList } from '../models/shopping.model';
import { useShoppingStore } from '../store/shopping.store';

export function useShopping() {
    const store = useShoppingStore();

    const fetchLists = useCallback(async () => {
        store.setLoading(true);
        try {
            const lists = await shoppingService.getLists();
            store.setLists(lists);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const createList = useCallback(async (data: Partial<ShoppingList>) => {
        const list = await shoppingService.createList(data);
        store.addList(list);
        return list;
    }, []);

    const deleteList = useCallback(async (id: string) => {
        await shoppingService.deleteList(id);
        store.removeList(id);
    }, []);

    const fetchItems = useCallback(async (listId: string) => {
        store.setLoading(true);
        try {
            const items = await shoppingService.getItems(listId);
            store.setSelectedListItems(items);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const addItem = useCallback(async (listId: string, data: Partial<ShoppingItem>) => {
        const item = await shoppingService.addItem(listId, data);
        store.addItem(item);
        return item;
    }, []);

    const toggleItem = useCallback(async (listId: string, itemId: string) => {
        await shoppingService.toggleItem(listId, itemId);
        store.toggleItem(itemId);
    }, []);

    const deleteItem = useCallback(async (listId: string, itemId: string) => {
        await shoppingService.deleteItem(listId, itemId);
        store.removeItem(itemId);
    }, []);

    return {
        ...store,
        fetchLists,
        createList,
        deleteList,
        fetchItems,
        addItem,
        toggleItem,
        deleteItem,
    };
}

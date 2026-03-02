// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback } from 'react';
import { shoppingService } from '../../services/shopping.service';
import type {
    ShoppingItemRequest,
    ShoppingListRequest,
} from '../models/shopping.model';
import { useShoppingStore } from '../store/shopping.store';

export function useShopping() {
    const lists = useShoppingStore((s) => s.lists);
    const selectedListItems = useShoppingStore((s) => s.selectedListItems);
    const isLoading = useShoppingStore((s) => s.isLoading);
    const setLoading = useShoppingStore((s) => s.setLoading);
    const setLists = useShoppingStore((s) => s.setLists);
    const addList = useShoppingStore((s) => s.addList);
    const updateList = useShoppingStore((s) => s.updateList);
    const removeList = useShoppingStore((s) => s.removeList);
    const setSelectedListItems = useShoppingStore((s) => s.setSelectedListItems);
    const addItemToStore = useShoppingStore((s) => s.addItem);
    const updateItemInStore = useShoppingStore((s) => s.updateItem);
    const removeItem = useShoppingStore((s) => s.removeItem);

    const fetchLists = useCallback(async () => {
        setLoading(true);
        try {
            const lists = await shoppingService.getLists();
            setLists(lists);
        } finally {
            setLoading(false);
        }
    }, [setLoading, setLists]);

    const createList = useCallback(async (data: ShoppingListRequest) => {
        const list = await shoppingService.createList(data);
        addList(list);
        return list;
    }, [addList]);

    const deleteList = useCallback(async (id: string) => {
        await shoppingService.deleteList(id);
        removeList(id);
    }, [removeList]);

    const updateListArchive = useCallback(async (id: string, archived: boolean) => {
        const list = await shoppingService.updateListArchive(id, archived);
        updateList(list);
        return list;
    }, [updateList]);

    const fetchItems = useCallback(async (listId: string) => {
        setLoading(true);
        // Prevent stale items from another list while loading.
        setSelectedListItems([]);
        try {
            const items = await shoppingService.getItems(listId);
            setSelectedListItems(items);
        } catch (error) {
            // Keep the UI consistent with the active list on failures.
            setSelectedListItems([]);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [setLoading, setSelectedListItems]);

    const addItem = useCallback(async (listId: string, data: ShoppingItemRequest) => {
        const item = await shoppingService.addItem(listId, data);
        addItemToStore(item);
        return item;
    }, [addItemToStore]);

    const updateItemCheck = useCallback(async (listId: string, itemId: string, checked: boolean) => {
        const item = await shoppingService.updateItemCheck(listId, itemId, checked);
        updateItemInStore(item);
        return item;
    }, [updateItemInStore]);

    const deleteItem = useCallback(async (listId: string, itemId: string) => {
        await shoppingService.deleteItem(listId, itemId);
        removeItem(itemId);
    }, [removeItem]);

    const fetchRecommendations = useCallback(async (listId?: string, topK = 10) => {
        return shoppingService.getRecommendations(listId, topK);
    }, []);

    const trainRecommendations = useCallback(async () => {
        return shoppingService.trainRecommendations();
    }, []);

    return {
        lists,
        selectedListItems,
        isLoading,
        fetchLists,
        createList,
        deleteList,
        updateListArchive,
        fetchItems,
        addItem,
        updateItemCheck,
        deleteItem,
        fetchRecommendations,
        trainRecommendations,
    };
}

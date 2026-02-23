// Kisa aciklama: Servis akislarini yonetir.
import { shoppingApi } from '../src/api/shopping.api';
import type {
    ShoppingItem,
    ShoppingItemRequest,
    ShoppingList,
    ShoppingListRequest,
    ShoppingListSummary,
} from '../src/models/shopping.model';

export const shoppingService = {
    getLists: async (): Promise<ShoppingList[]> => {
        const response = await shoppingApi.getLists();
        return response.data.data.content || [];
    },

    createList: async (data: ShoppingListRequest): Promise<ShoppingList> => {
        const response = await shoppingApi.createList(data);
        return response.data.data;
    },

    deleteList: async (id: string): Promise<void> => {
        await shoppingApi.deleteList(id);
    },

    updateListArchive: async (id: string, archived: boolean): Promise<ShoppingList> => {
        const response = await shoppingApi.updateListArchive(id, archived);
        return response.data.data;
    },

    getListSummary: async (listId: string): Promise<ShoppingListSummary> => {
        const response = await shoppingApi.getListSummary(listId);
        return response.data.data;
    },

    getItems: async (listId: string): Promise<ShoppingItem[]> => {
        const response = await shoppingApi.getItems(listId);
        return response.data.data.content || [];
    },

    addItem: async (listId: string, data: ShoppingItemRequest): Promise<ShoppingItem> => {
        const response = await shoppingApi.addItem(listId, data);
        return response.data.data;
    },

    updateItemCheck: async (listId: string, itemId: string, checked: boolean): Promise<ShoppingItem> => {
        const response = await shoppingApi.updateItemCheck(listId, itemId, checked);
        return response.data.data;
    },

    deleteItem: async (listId: string, itemId: string): Promise<void> => {
        await shoppingApi.deleteItem(listId, itemId);
    },
};
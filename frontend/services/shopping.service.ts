import { shoppingApi } from '../src/api/shopping.api';
import type { ShoppingItem, ShoppingList } from '../src/models/shopping.model';

export const shoppingService = {
    getLists: async (): Promise<ShoppingList[]> => {
        const response = await shoppingApi.getLists();
        return response.data;
    },

    createList: async (data: Partial<ShoppingList>): Promise<ShoppingList> => {
        const response = await shoppingApi.createList(data);
        return response.data;
    },

    deleteList: async (id: string): Promise<void> => {
        await shoppingApi.deleteList(id);
    },

    getItems: async (listId: string): Promise<ShoppingItem[]> => {
        const response = await shoppingApi.getItems(listId);
        return response.data;
    },

    addItem: async (listId: string, data: Partial<ShoppingItem>): Promise<ShoppingItem> => {
        const response = await shoppingApi.addItem(listId, data);
        return response.data;
    },

    toggleItem: async (listId: string, itemId: string): Promise<void> => {
        await shoppingApi.toggleItem(listId, itemId);
    },

    deleteItem: async (listId: string, itemId: string): Promise<void> => {
        await shoppingApi.deleteItem(listId, itemId);
    },
};

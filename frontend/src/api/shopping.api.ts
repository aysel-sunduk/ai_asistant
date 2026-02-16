import type { ShoppingItem, ShoppingList } from '../models/shopping.model';
import apiClient from './client';

export const shoppingApi = {
    getLists: () => apiClient.get<ShoppingList[]>('/shopping/lists'),
    createList: (data: Partial<ShoppingList>) => apiClient.post<ShoppingList>('/shopping/lists', data),
    deleteList: (id: string) => apiClient.delete(`/shopping/lists/${id}`),
    getItems: (listId: string) => apiClient.get<ShoppingItem[]>(`/shopping/lists/${listId}/items`),
    addItem: (listId: string, data: Partial<ShoppingItem>) => apiClient.post<ShoppingItem>(`/shopping/lists/${listId}/items`, data),
    toggleItem: (listId: string, itemId: string) => apiClient.patch(`/shopping/lists/${listId}/items/${itemId}/toggle`),
    deleteItem: (listId: string, itemId: string) => apiClient.delete(`/shopping/lists/${listId}/items/${itemId}`),
};

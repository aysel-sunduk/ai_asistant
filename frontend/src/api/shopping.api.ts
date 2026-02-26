// Kisa aciklama: Backend API cagrilarini toplar.
import type { ApiResponse } from '../models/auth.model';
import type {
    ShoppingItem,
    ShoppingItemPage,
    ShoppingItemRequest,
    ShoppingList,
    ShoppingListPage,
    ShoppingListRequest,
    ShoppingListSummary,
} from '../models/shopping.model';
import apiClient from './client';

const BASE_PATH = '/v1/shopping';

export const shoppingApi = {
    getLists: (page = 0, size = 50, archived?: boolean) =>
        apiClient.get<ApiResponse<ShoppingListPage>>(`${BASE_PATH}/lists`, {
            params: { page, size, archived, sortBy: 'createdAt', sortDirection: 'DESC' },
        }),

    createList: (data: ShoppingListRequest) =>
        apiClient.post<ApiResponse<ShoppingList>>(`${BASE_PATH}/lists`, data),

    deleteList: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/lists/${id}`),

    updateListArchive: (id: string, archived: boolean) =>
        apiClient.patch<ApiResponse<ShoppingList>>(`${BASE_PATH}/lists/${id}/archive`, { archived }),

    getListSummary: (listId: string) =>
        apiClient.get<ApiResponse<ShoppingListSummary>>(`${BASE_PATH}/lists/${listId}/summary`),

    getItems: (listId: string, page = 0, size = 100) =>
        apiClient.get<ApiResponse<ShoppingItemPage>>(`${BASE_PATH}/lists/${listId}/items`, {
            params: { page, size, sortBy: 'name', sortDirection: 'ASC' },
        }),

    getItemById: (itemId: string) =>
        apiClient.get<ApiResponse<ShoppingItem>>(`${BASE_PATH}/items/${itemId}`),

    addItem: (listId: string, data: ShoppingItemRequest) =>
        apiClient.post<ApiResponse<ShoppingItem>>(`${BASE_PATH}/lists/${listId}/items`, data),

    updateItemCheck: (listId: string, itemId: string, checked: boolean) =>
        apiClient.patch<ApiResponse<ShoppingItem>>(
            `${BASE_PATH}/lists/${listId}/items/${itemId}/check`,
            { checked },
        ),

    deleteItem: (listId: string, itemId: string) =>
        apiClient.delete<ApiResponse<void>>(`${BASE_PATH}/lists/${listId}/items/${itemId}`),
};

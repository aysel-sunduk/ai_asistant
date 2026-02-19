export interface ShoppingList {
    id: string;
    userId: string;
    name: string;
    isArchived: boolean;
    createdAt: string;
}

export interface ShoppingItem {
    id: string;
    listId: string;
    name: string;
    quantity: number;
    unit?: string | null;
    estimatedPriceMinor?: number | null;
    isChecked: boolean;
    note?: string | null;
}

export interface ShoppingListRequest {
    name: string;
    isArchived?: boolean;
}

export interface ShoppingItemRequest {
    name: string;
    quantity?: number;
    unit?: string;
    estimatedPriceMinor?: number;
    isChecked?: boolean;
    note?: string;
}

export interface ShoppingListSummary {
    totalEstimatedPriceMinor: number;
    totalCheckedPriceMinor: number;
    totalItemCount: number;
    checkedItemCount: number;
}

export interface ShoppingListPage {
    content: ShoppingList[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface ShoppingItemPage {
    content: ShoppingItem[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

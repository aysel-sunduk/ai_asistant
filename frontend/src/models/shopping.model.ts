// Kisa aciklama: Destekleyici modul kodu icerir.
export type ShoppingRecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ShoppingList {
    id: string;
    userId: string;
    name: string;
    isArchived: boolean;
    recurrenceType: ShoppingRecurrenceType;
    createdAt: string;
}

export interface ShoppingItem {
    id: string;
    listId: string;
    name: string;
    productKey?: string;
    category?: string | null;
    quantity: number;
    unit?: string | null;
    estimatedPriceMinor?: number | null;
    isChecked: boolean;
    note?: string | null;
    addedAt?: string;
    checkedAt?: string | null;
}

export interface ShoppingListRequest {
    name: string;
    isArchived?: boolean;
    recurrenceType?: ShoppingRecurrenceType;
}

export interface ShoppingItemRequest {
    name: string;
    quantity?: number;
    category?: string;
    unit?: string;
    estimatedPriceMinor?: number;
    isChecked?: boolean;
    note?: string;
}

export interface ShoppingRecommendation {
    productKey: string;
    itemName: string;
    category?: string | null;
    score: number;
    reasons: string[];
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

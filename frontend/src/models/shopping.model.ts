export interface ShoppingList {
    id: string;
    userId: string;
    name: string;
    itemCount: number;
    completedCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ShoppingItem {
    id: string;
    listId: string;
    name: string;
    quantity?: number;
    unit?: string;
    isChecked: boolean;
    createdAt: string;
}

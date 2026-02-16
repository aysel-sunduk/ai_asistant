export interface FinanceAccount {
    id: string;
    userId: string;
    name: string;
    type: 'bank' | 'cash' | 'credit_card' | 'investment';
    balance: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinanceCategory {
    id: string;
    userId: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
    createdAt: string;
}

export interface FinanceTransaction {
    id: string;
    userId: string;
    accountId: string;
    categoryId: string;
    type: 'income' | 'expense';
    amount: number;
    currency: string;
    description?: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}

export interface Investment {
    id: string;
    userId: string;
    name: string;
    type: 'stock' | 'crypto' | 'fund' | 'gold' | 'other';
    symbol?: string;
    amount: number;
    buyPrice: number;
    currentPrice: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

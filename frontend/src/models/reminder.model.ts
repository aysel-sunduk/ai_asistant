export interface Reminder {
    id: string;
    userId: string;
    title: string;
    description?: string;
    dateTime: string;
    isRecurring: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
}

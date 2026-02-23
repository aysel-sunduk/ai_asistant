// Kisa aciklama: Destekleyici modul kodu icerir.
export type ReminderSourceModule =
    | 'general'
    | 'business'
    | 'work'
    | 'family'
    | 'health'
    | 'finance'
    | 'social'
    | 'shopping'
    | 'goals';

export type ReminderRecurrence =
    | 'none'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'weekdays'
    | 'custom';

export type ReminderChannel = 'in_app' | 'email' | 'push' | 'sms';
export type ReminderStatus = 'scheduled' | 'sent' | 'skipped' | 'canceled';

export interface Reminder {
    id: string;
    userId: string;
    workEventId?: string | null;
    contactId?: string | null;
    sourceModule: ReminderSourceModule;
    title: string;
    remindAt: string;
    recurrence: ReminderRecurrence;
    channel: ReminderChannel;
    status: ReminderStatus;
    createdAt: string;
    updatedAt: string;

    // Legacy UI compatibility
    dateTime?: string;
    isCompleted?: boolean;
}

export interface ReminderRequest {
    title: string;
    remindAt: string;
    workEventId?: string | null;
    contactId?: string | null;
    sourceModule?: ReminderSourceModule;
    recurrence?: ReminderRecurrence;
    channel?: ReminderChannel;
}

export interface ReminderPage {
    content: Reminder[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}
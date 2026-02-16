export interface WorkEvent {
    id: string;
    userId: string;
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    isAllDay: boolean;
    reminder?: number; // dakika cinsinden
    createdAt: string;
    updatedAt: string;
}

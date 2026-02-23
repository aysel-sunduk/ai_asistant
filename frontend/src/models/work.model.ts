// Kisa aciklama: Destekleyici modul kodu icerir.
export interface WorkEvent {
    id: string;
    userId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    participantCount?: number;
    location?: string;
    status?: string;
    priority?: string;
    eventType?: string;
    isOnline?: boolean;
    meetingUrl?: string;
    reminderSent?: boolean;
    reminderMinutesBefore?: number;
    metadata?: Record<string, unknown>;
    notes?: string;
    durationMinutes?: number;
    createdAt: string;
    updatedAt: string;

    // Legacy fields kept for backward compatibility in existing UI/state.
    isAllDay?: boolean;
    reminder?: number;
}

export interface WorkEventRequest {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    participantCount?: number;
    location?: string;
    status?: string;
    priority?: string;
    eventType?: string;
    isOnline?: boolean;
    meetingUrl?: string;
    reminderMinutesBefore?: number;
    metadata?: Record<string, unknown>;
    notes?: string;
}

export interface WorkEventsSummary {
    totalEvents: number;
    scheduledEvents: number;
    completedEvents: number;
    cancelledEvents: number;
    upcomingEvents: number;
    todayEvents: number;
    thisWeekEvents: number;
    averageDurationMinutes: number;
    totalParticipants: number;
}

export interface WorkEventsPage {
    content: WorkEvent[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}
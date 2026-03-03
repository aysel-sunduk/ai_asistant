// Kisa aciklama: Destekleyici modul kodu icerir.
export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    category?: string;
    targetDate?: string;
    progressPct: number; // 0-100
    isCompleted: boolean;
    milestones: GoalMilestone[];
    createdAt: string;
    updatedAt: string;
}

export interface GoalMilestone {
    title: string;
    isCompleted?: boolean;
    targetDate?: string;
    [key: string]: unknown;
}

export type Milestone = GoalMilestone;

export interface GoalRequest {
    title: string;
    description?: string;
    category?: string;
    targetDate?: string;
    progressPct?: number;
    isCompleted?: boolean;
    milestones?: GoalMilestone[];
}

export interface GoalPage {
    content: Goal[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface GoalMotivationResponse {
    message: string;
    goalTitle: string;
    progressPct: number;
}
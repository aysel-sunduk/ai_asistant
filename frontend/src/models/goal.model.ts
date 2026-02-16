export interface Goal {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetDate?: string;
    status: 'active' | 'completed' | 'paused' | 'cancelled';
    progress: number; // 0-100
    milestones: Milestone[];
    createdAt: string;
    updatedAt: string;
}

export interface Milestone {
    id: string;
    goalId: string;
    title: string;
    isCompleted: boolean;
    completedAt?: string;
    order: number;
}

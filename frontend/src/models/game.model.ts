// Kisa aciklama: Destekleyici modul kodu icerir.
export type BackendGameType = 'sudoku' | 'quiz' | 'memory';
export type FrontendGameType = BackendGameType | '2048';

export interface GameScore {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    lastNameMasked?: string;
    displayName?: string;
    gameType: BackendGameType;
    score: number;
    level?: number;
    duration?: number; // saniye cinsinden
    createdAt: string;
}

export interface GameRankSummary {
    gameType: BackendGameType;
    bestScore: number | null;
    globalRank: number | null;
    globalPlayerCount: number;
    friendsRank: number | null;
    friendsPlayerCount: number;
}

export interface PlayerSegmentResponse {
    segment: string;
    message: string;
    stats: {
        avgScore: number;
        playCount: number;
        improvementRate: number;
    };
    method: string;
}

export interface PerformanceTrendResponse {
    trend: 'yükseliş' | 'düşüş' | 'stabil';
    improvementPct: number;
    message: string;
    weeklyAvgScores: number[];
    method: string;
}

export interface MotivationResponse {
    label: number;
    labelName: string;
    message: string;
    method: string;
    confidence?: number;
}
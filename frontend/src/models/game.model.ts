export type BackendGameType = 'sudoku' | 'quiz' | 'memory';
export type FrontendGameType = BackendGameType | '2048';

export interface GameScore {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
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

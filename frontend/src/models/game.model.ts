export type GameType = 'sudoku' | 'quiz' | 'memory';

export interface GameScore {
    id: string;
    userId: string;
    gameType: GameType;
    score: number;
    level?: number;
    duration?: number; // saniye cinsinden
    createdAt: string;
}

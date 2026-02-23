// Kisa aciklama: Destekleyici modul kodu icerir.
import { gamesService } from '../../services/games.service';
import type { FrontendGameType } from '../models/game.model';

// ─── Time Formatting ──────────────────────────────────────────
export function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

// ─── Score Persistence ────────────────────────────────────────
export interface GameResult {
    game: FrontendGameType;
    time: number; // ms
    score?: number; // e.g. 8/10 for quiz
    date: string;
}

function resolveScore(game: FrontendGameType, timeMs: number, score?: number): number {
    if (game === '2048') {
        return Math.max(0, score ?? 0);
    }
    const safeTimeMs = Math.max(1000, timeMs);
    if (game === 'memory') {
        return Math.max(1, Math.round(100000 / safeTimeMs));
    }
    return Math.max(1, Math.round(200000 / safeTimeMs));
}

export async function saveGameResult(game: FrontendGameType, time: number, score?: number): Promise<void> {
    try {
        await gamesService.submitScore({
            gameType: game,
            score: resolveScore(game, time, score),
            duration: Math.max(0, Math.round(time / 1000)),
            level: 1,
            difficulty: 'medium',
            metadata: score != null ? { rawScore: score } : undefined,
            createdAt: new Date().toISOString(),
        });
    } catch (e) {
        console.error('[GameUtils] Failed to save result', e);
    }
}

export async function getGameResults(game: FrontendGameType): Promise<GameResult[]> {
    try {
        const scores = await gamesService.getScores(game);
        return scores.map((item) => ({
            game,
            time: (item.duration ?? 0) * 1000,
            score: item.score,
            date: item.createdAt,
        }));
    } catch {
        return [];
    }
}

export async function getBestResult(game: FrontendGameType): Promise<GameResult | null> {
    const results = await getGameResults(game);
    if (results.length === 0) return null;
    // Best = highest score then lowest time (2048) or lowest time (memory/sudoku)
    if (game === '2048') {
        return results.reduce((best, r) => {
            if (!best) return r;
            if ((r.score || 0) > (best.score || 0)) return r;
            if ((r.score || 0) === (best.score || 0) && r.time < best.time) return r;
            return best;
        });
    }
    return results.reduce((best, r) => (r.time < best.time ? r : best));
}

// ─── Sudoku Generator ─────────────────────────────────────────
type Board = number[][];

function createEmptyBoard(): Board {
    return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(board: Board, row: number, col: number, num: number): boolean {
    // Check row
    for (let c = 0; c < 9; c++) {
        if (board[row][c] === num) return false;
    }
    // Check col
    for (let r = 0; r < 9; r++) {
        if (board[r][col] === num) return false;
    }
    // Check 3×3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (board[r][c] === num) return false;
        }
    }
    return true;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function solveSudoku(board: Board): boolean {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                for (const num of nums) {
                    if (isValid(board, r, c, num)) {
                        board[r][c] = num;
                        if (solveSudoku(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

export function generateSudoku(clues: number = 36): { puzzle: Board; solution: Board } {
    const board = createEmptyBoard();
    solveSudoku(board);
    const solution = board.map(row => [...row]);
    const puzzle = board.map(row => [...row]);

    // Remove cells to create puzzle
    const positions = shuffle(
        Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
    );

    let removed = 0;
    const target = 81 - clues;
    for (const [r, c] of positions) {
        if (removed >= target) break;
        puzzle[r][c] = 0;
        removed++;
    }

    return { puzzle, solution };
}

// ─── Memory Game Emojis ───────────────────────────────────────
const EMOJI_POOL = ['🚀', '🎯', '🧩', '💎', '🔥', '⚡', '🎲', '🏆', '🌟', '🎵', '🦊', '🐻', '🍕', '🌈', '🎸', '🚗'];

export function getMemoryCards(pairs: number = 8): string[] {
    const selected = shuffle(EMOJI_POOL).slice(0, pairs);
    return shuffle([...selected, ...selected]);
}
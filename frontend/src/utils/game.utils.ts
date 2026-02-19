import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Time Formatting ──────────────────────────────────────────
export function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
}

// ─── Score Persistence ────────────────────────────────────────
export interface GameResult {
    game: string;
    time: number; // ms
    score?: number; // e.g. 8/10 for quiz
    date: string;
}

const RESULTS_KEY = '@game_results';

export async function saveGameResult(game: string, time: number, score?: number): Promise<void> {
    try {
        const existing = await getGameResults(game);
        existing.push({ game, time, score, date: new Date().toISOString() });
        // Keep last 50 results per game
        const trimmed = existing.slice(-50);
        const allResults = await getAllResults();
        allResults[game] = trimmed;
        await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(allResults));
    } catch (e) {
        console.error('[GameUtils] Failed to save result', e);
    }
}

export async function getGameResults(game: string): Promise<GameResult[]> {
    try {
        const allResults = await getAllResults();
        return allResults[game] || [];
    } catch {
        return [];
    }
}

export async function getBestResult(game: string): Promise<GameResult | null> {
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

async function getAllResults(): Promise<Record<string, GameResult[]>> {
    try {
        const raw = await AsyncStorage.getItem(RESULTS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
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

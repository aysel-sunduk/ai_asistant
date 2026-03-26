// Kisa aciklama: Destekleyici modul kodu icerir.
/**
 * API temel URL'si
 */
export const API_URL = 'http://192.168.234.217:8080/api';

/**
 * İşlem tipleri
 */
export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense',
} as const;

/**
 * Sağlık log tipleri
 */
export const HEALTH_LOG_TYPES = {
    WATER: 'water',
    EXERCISE: 'exercise',
    MEAL: 'meal',
    SLEEP: 'sleep',
    WEIGHT: 'weight',
} as const;

/**
 * Oyun tipleri
 */
export const GAME_TYPES = {
    SUDOKU: 'sudoku',
    QUIZ: 'quiz',
    MEMORY: 'memory',
} as const;

/**
 * Hedef durumları
 */
export const GOAL_STATUSES = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    PAUSED: 'paused',
    CANCELLED: 'cancelled',
} as const;

/**
 * Hatırlatıcı tekrar kalıpları
 */
export const RECURRING_PATTERNS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
} as const;

/**
 * Diller
 */
export const LANGUAGES = {
    TR: 'tr',
    EN: 'en',
} as const;
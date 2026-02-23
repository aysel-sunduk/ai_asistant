// Kisa aciklama: Destekleyici modul kodu icerir.
// DB şeması: health_log_type ENUM + JSONB data
export type HealthLogType =
    | 'daily_summary'
    | 'water'
    | 'exercise'
    | 'meal'
    | 'steps'
    | 'distance'
    | 'active_calories'
    | 'heart_rate';

// ─── JSONB "data" tipleri (log_type'a göre) ───

export interface WaterData {
    amount_ml: number; // içilen su miktarı (ml)
}

export interface ExerciseData {
    activity: string;        // yürüyüş, koşu, bisiklet, yoga vb.
    duration_min: number;    // süre (dakika)
    calories_burned?: number;
    distance_km?: number;
    notes?: string;
}

export interface MealData {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // öğün tipi
    description: string;     // yenilen yemek açıklaması
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
}

export interface DailySummaryData {
    mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
    sleep_hours?: number;
    weight_kg?: number;
    steps?: number;
    notes?: string;
}

export interface StepsData {
    count: number;
}

export interface DistanceData {
    kilometers: number;
}

export interface ActiveCaloriesData {
    kcal: number;
}

export interface HeartRateData {
    bpm: number;
}

// ─── Ana model ───

export interface HealthLog {
    id: string;
    userId: string;
    logType: HealthLogType;
    logDate: string;            // YYYY-MM-DD
    data: WaterData | ExerciseData | MealData | DailySummaryData | StepsData | DistanceData | ActiveCaloriesData | HeartRateData;
    source?: string;
    externalRecordId?: string;
    loggedAt: string;
}

export interface HealthGoals {
    userId: string;
    waterMlTarget: number;
    stepsTarget: number;
    createdAt: string;
    updatedAt: string;
}
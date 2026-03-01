// Kisa aciklama: Destekleyici modul kodu icerir.
export interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    roleId?: number;
    createdAt?: string;
    updatedAt?: string;
}

// ─── GET /api/v1/profile Response ───
export interface UserProfile {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    profileVisibility: string;

    birthDate?: string;
    gender?: string;
    heightCm?: number;
    weightKg?: number;

    timezone?: string;
    locale?: string;
    preferredCurrency?: string;
    monthlyIncomeEstimateMinor?: number;

    interests?: Record<string, any>;
    onboarding?: Record<string, any>;
    notifications?: Record<string, any>;

    showEmail?: boolean;
    showPhone?: boolean;
}

// ─── PUT /api/v1/profile Request ───
export interface UpdateProfileRequest {
    fullName?: string;
    birthDate?: string;
    gender?: string;
    timezone?: string;
    locale?: string;
    profileVisibility?: string;
    heightCm?: number;
    weightKg?: number;
    preferredCurrency?: string;
    monthlyIncomeEstimateMinor?: number;
    interests?: Record<string, any>;
    onboarding?: Record<string, any>;
    notifications?: Record<string, any>;
    showEmail?: boolean;
    showPhone?: boolean;
}

// ─── Helpers ───
export const GENDER_LABELS: Record<string, string> = {
    MALE: 'Erkek',
    FEMALE: 'Kadın',
    OTHER: 'Diğer',
    PREFER_NOT_TO_SAY: 'Belirtmek İstemiyorum',
};

export const VISIBILITY_LABELS: Record<string, string> = {
    PUBLIC: 'Herkese Açık',
    PRIVATE: 'Gizli',
    FRIENDS_ONLY: 'Sadece Arkadaşlar',
};
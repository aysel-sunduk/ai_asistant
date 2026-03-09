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
    activityLevel?: string;
    bodyType?: string;
    bmi?: number;
    bmr?: number;
    bodyFatPercentage?: number;
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
    bloodType?: string;
    activityLevel?: string;
    bodyType?: string;
}

// ─── Helpers ───
export const GENDER_LABELS: Record<string, string> = {
    MALE: 'Erkek',
    FEMALE: 'Kadın',
    PREFER_NOT_TO_SAY: 'Belirtmek İstemiyorum',
};

export const VISIBILITY_LABELS: Record<string, string> = {
    PUBLIC: 'Herkese Açık',
    PRIVATE: 'Gizli',
    FRIENDS_ONLY: 'Sadece Arkadaşlar',
};

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
    SEDENTARY: 'Hareketsiz',
    LIGHTLY_ACTIVE: 'Hafif Hareketli',
    MODERATELY_ACTIVE: 'Orta Hareketli',
    VERY_ACTIVE: 'Çok Hareketli',
    EXTRA_ACTIVE: 'Ekstra Hareketli',
};

export const BODY_TYPE_LABELS: Record<string, string> = {
    ECTOMORPH: 'Ektomorf (İnce, Zor Kilo Alan)',
    MESOMORPH: 'Mezomorf (Atletik, Kaslı)',
    ENDOMORPH: 'Endomorf (İri Kemikli, Kolay Kilo Alan)',
};

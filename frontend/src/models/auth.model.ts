// Kisa aciklama: Destekleyici modul kodu icerir.
// ─── Genel API Response Wrapper ───
export interface ApiResponse<T> {
    status?: string;
    success?: boolean;
    message: string;
    data: T;
    errorCode?: string;
    timestamp?: string;
}

// ─── Login ───
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    email: string;
}

// ─── Register ───
export interface RegisterRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
}

export interface RegisterResponse {
    email: string;
    message: string;
}

// ─── Token ───
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

// ─── Forgot / Reset Password ───
export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// ─── Change Password ───
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
    timestamp: string;
}

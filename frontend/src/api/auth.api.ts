// Kisa aciklama: Backend API cagrilarini toplar.
import type {
    ApiResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
} from '../models/auth.model';
import apiClient from './client';

export const authApi = {
    login: (data: LoginRequest) =>
        apiClient.post<ApiResponse<LoginResponse>>('/v1/auth/login', data),

    register: (data: RegisterRequest) =>
        apiClient.post<ApiResponse<RegisterResponse>>('/v1/auth/register', data),

    refreshToken: (data: RefreshTokenRequest) =>
        apiClient.post<ApiResponse<TokenResponse>>('/v1/auth/refresh', data),

    logout: () =>
        apiClient.post<ApiResponse<{ message: string }>>('/v1/auth/logout'),

    forgotPassword: (email: string) =>
        apiClient.post('/v1/auth/forgot-password', { email }),

    resetPassword: (data: { token: string; password: string }) =>
        apiClient.post('/v1/auth/reset-password', data),
<<<<<<< Updated upstream
};
=======

    changePassword: (data: ChangePasswordRequest) =>
        apiClient.post<ApiResponse<ChangePasswordResponse>>('/v1/auth/change-password', data),
};
>>>>>>> Stashed changes

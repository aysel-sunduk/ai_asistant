// Kisa aciklama: Servis akislarini yonetir.
import { authApi } from '../src/api/auth.api';
import type { ChangePasswordRequest, ChangePasswordResponse, LoginResponse, RegisterRequest, RegisterResponse, TokenResponse } from '../src/models/auth.model';
import { storage } from '../src/utils/storage';

// ─── Mock Ayarları ───
// Backend olmadan test etmek için USE_MOCK = true yapın.
// Backend hazır olduğunda false yapmanız yeterli.
const USE_MOCK = false;

const MOCK_USER = {
    email: 'zeki@test.com',
    password: 'Test123',
};

const MOCK_TOKENS = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-xyz',
};

export const authService = {
    login: async (data: { email: string; password: string }): Promise<LoginResponse> => {
        if (USE_MOCK) {
            // Simüle edilmiş ağ gecikmesi
            await new Promise((r) => setTimeout(r, 800));

            if (data.email === MOCK_USER.email && data.password === MOCK_USER.password) {
                const loginData: LoginResponse = {
                    accessToken: MOCK_TOKENS.accessToken,
                    refreshToken: MOCK_TOKENS.refreshToken,
                    email: MOCK_USER.email,
                };
                await storage.setItem('accessToken', loginData.accessToken);
                await storage.setItem('refreshToken', loginData.refreshToken);
                return loginData;
            }

            // Yanlış bilgi girildiğinde hata fırlat
            const error: any = new Error('Giriş başarısız');
            error.response = {
                data: { message: 'E-posta veya şifre hatalı' },
            };
            throw error;
        }

        const response = await authApi.login(data).catch((err) => {
            console.error('[authService] login error details:', JSON.stringify(err, null, 2), err.message, err.response?.data);
            throw err;
        });
        const loginData = response.data.data;
        await storage.setItem('accessToken', loginData.accessToken);
        await storage.setItem('refreshToken', loginData.refreshToken);
        return loginData;
    },

    register: async (data: RegisterRequest): Promise<RegisterResponse> => {
        if (USE_MOCK) {
            await new Promise((r) => setTimeout(r, 500));
            return { email: data.email, message: 'Kayıt başarılı' };
        }
        const response = await authApi.register(data);
        return response.data.data;
    },

    logout: async (): Promise<void> => {
        if (USE_MOCK) {
            await storage.removeItem('accessToken');
            await storage.removeItem('refreshToken');
            return;
        }
        await authApi.logout();
        await storage.removeItem('accessToken');
        await storage.removeItem('refreshToken');
    },

    refreshToken: async (): Promise<TokenResponse> => {
        if (USE_MOCK) {
            return MOCK_TOKENS;
        }
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await authApi.refreshToken({ refreshToken });
        const tokens = response.data.data;
        await storage.setItem('accessToken', tokens.accessToken);
        await storage.setItem('refreshToken', tokens.refreshToken);
        return tokens;
    },

    forgotPassword: async (email: string): Promise<void> => {
        if (USE_MOCK) {
            await new Promise((r) => setTimeout(r, 500));
            return;
        }
        await authApi.forgotPassword(email);
    },

    resetPassword: async (data: { token: string; password: string }): Promise<void> => {
        if (USE_MOCK) {
            await new Promise((r) => setTimeout(r, 500));
            return;
        }
        await authApi.resetPassword(data);
    },
    changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
        if (USE_MOCK) {
            await new Promise((r) => setTimeout(r, 500));
            return { message: 'Şifre başarıyla değiştirildi', timestamp: new Date().toISOString() };
        }
        const response = await authApi.changePassword(data);
        return response.data.data;
    },
};

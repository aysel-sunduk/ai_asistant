// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback, useState } from 'react';
import { authService } from '../../services/auth.service';
import type { LoginRequest, RegisterRequest } from '../models/auth.model';
import { useAuthStore } from '../store/auth.store';

export function useAuth() {
    const store = useAuthStore();
    const [error, setError] = useState<string | null>(null);

    const login = useCallback(async (data: LoginRequest) => {
        try {
            store.setLoading(true);
            setError(null);
            const loginData = await authService.login(data);
            store.setTokens({
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken,
            });
            // Backend'den user bilgisi geldiğinde burayı güncelleyin
            store.setUser({
                id: '',
                email: loginData.email,
                username: loginData.email,
            });
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Giriş başarısız';
            setError(msg);
            throw err;
        } finally {
            store.setLoading(false);
        }
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        try {
            store.setLoading(true);
            setError(null);
            const result = await authService.register(data);
            return result; // { email, message } — token dönmüyor
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Kayıt başarısız';
            setError(msg);
            throw err;
        } finally {
            store.setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } finally {
            store.logout();
        }
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        try {
            store.setLoading(true);
            setError(null);
            await authService.forgotPassword(email);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'İşlem başarısız');
            throw err;
        } finally {
            store.setLoading(false);
        }
    }, []);

    return {
        user: store.user,
        profile: store.profile,
        isAuthenticated: store.isAuthenticated,
        isLoading: store.isLoading,
        error,
        login,
        register,
        logout,
        forgotPassword,
    };
}
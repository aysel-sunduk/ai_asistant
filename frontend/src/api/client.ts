// Kisa aciklama: Backend API cagrilarini toplar.
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_URL = 'http://10.166.144.153:8080/api';

const getDevServerHost = (): string | null => {
    try {
        const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
        if (!scriptURL) return null;
        const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?/i);
        return match?.[1] || null;
    } catch {
        return null;
    }
};

const resolveApiBaseUrl = (): string => {
    // 1. Try ENV variable
    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (envUrl) return envUrl.replace(/\/$/, '');

    // 2. Development build'de Metro host'unu yakala (fiziksel cihaz + emulator uyumlu).
    const metroHost = getDevServerHost();
    if (metroHost) {
        if (Platform.OS === 'android' && (metroHost === 'localhost' || metroHost === '127.0.0.1')) {
            return 'http://10.0.2.2:8080/api';
        }
        return `http://${metroHost}:8080/api`;
    }

    // 3. Last fallback - local LAN IP (gerektiginde manuel guncellenebilir).
    const host = '192.168.234.217'; // Your current LAN IP
    return `http://${host}:8080/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();
console.log('[ApiClient] Base URL:', API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

type RetryableRequestConfig = {
    _retry?: boolean;
    headers?: Record<string, string>;
    url?: string;
};

apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        const isAuthPath = config.url?.includes('/v1/auth/');
        const isChangePassword = config.url?.includes('/v1/auth/change-password');

        console.log('[ApiClient] Request:', config.url, 'Token exists:', !!token);

        // Don't send token for auth endpoints, except for change-password
        if (token && (!isAuthPath || isChangePassword)) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (!token) {
            console.warn('[ApiClient] No token found in AsyncStorage');
        }
        return config;
    },
    (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
    (response) => {
        try {
            const url = response.config?.url ?? '';
            const method = (response.config?.method ?? '').toString().toUpperCase();
            if (url.includes('/v1/health/logs')) {
                // eslint-disable-next-line no-console
                console.log('[ApiClient] Response:', method, url, 'status:', response.status, 'data:', response.data);
            }
        } catch { }
        return response;
    },
    async (error) => {
        const status = error.response?.status as number | undefined;
        const originalRequest = error.config as RetryableRequestConfig | undefined;
        const isAuthEndpoint = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/v1/auth/');

        // If access token fails, refresh once and retry the original request.
        if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const refreshResponse = await apiClient.post('/v1/auth/refresh', { refreshToken });
                const newAccessToken = refreshResponse?.data?.data?.accessToken as string | undefined;
                const newRefreshToken = refreshResponse?.data?.data?.refreshToken as string | undefined;

                if (!newAccessToken) {
                    throw new Error('Refresh response missing access token');
                }

                await AsyncStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    await AsyncStorage.setItem('refreshToken', newRefreshToken);
                }

                originalRequest.headers = {
                    ...(originalRequest.headers || {}),
                    Authorization: `Bearer ${newAccessToken}`,
                };

                return apiClient(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;

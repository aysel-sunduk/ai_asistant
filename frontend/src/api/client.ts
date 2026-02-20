import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.234.217:8080/api';
// const API_BASE_URL = 'http://localhost:8080/api';

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
        console.log('[ApiClient] Request:', config.url, 'Token exists:', !!token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('[ApiClient] No token found in AsyncStorage');
        }
        return config;
    },
    (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
    (response) => response,
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

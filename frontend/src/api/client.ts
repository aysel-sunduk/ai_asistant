import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.234.217:8080/api';
//const API_BASE_URL = 'http://localhost:8080/api';
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – JWT token ekleme
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        console.log('[ApiClient] Request:', config.url, 'Token exists:', !!token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log('[ApiClient] Auth Header:', config.headers.Authorization);
        } else {
            console.warn('[ApiClient] No token found in AsyncStorage');
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor – Hata yönetimi
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // 401 durumunda refresh token ile yenileme yapılabilir
        if (error.response?.status === 401) {
            // TODO: Token refresh mantığı
        }
        return Promise.reject(error);
    },
);

export default apiClient;

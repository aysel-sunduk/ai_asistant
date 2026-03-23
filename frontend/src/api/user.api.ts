import type { ApiResponse } from '../models/auth.model';
import type { User, UserProfile, UpdateProfileRequest } from '../models/user.model';
import apiClient, { API_BASE_URL } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PushTokenRequest {
    pushToken: string;
    platform?: string;
    deviceId?: string;
}

export const userApi = {
    getMe: () => apiClient.get<ApiResponse<User>>('/v1/users/me'),

    getProfile: () => apiClient.get<ApiResponse<UserProfile>>('/v1/profile'),

    updateProfile: (data: UpdateProfileRequest) =>
        apiClient.put<ApiResponse<UserProfile>>('/v1/profile', data),

    updatePushToken: (data: PushTokenRequest) =>
        apiClient.post<ApiResponse<any>>('/v1/users/push-token', data),

    uploadProfilePicture: async (data: FormData) => {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/v1/profile/picture`, {
            method: 'POST',
            body: data,
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            let errMsg = `Upload failed with status ${response.status}`;
            try {
                const parseErr = await response.json();
                if (parseErr.message) errMsg = parseErr.message;
            } catch (e) {}
            throw new Error(errMsg);
        }

        const json = await response.json();
        return { data: json } as { data: ApiResponse<UserProfile> };
    },
};
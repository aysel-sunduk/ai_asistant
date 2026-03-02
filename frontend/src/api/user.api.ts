import type { ApiResponse } from '../models/auth.model';
import type { User, UserProfile, UpdateProfileRequest } from '../models/user.model';
import apiClient from './client';

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
};
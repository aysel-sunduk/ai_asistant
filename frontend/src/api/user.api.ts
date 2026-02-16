import type { User, UserProfile } from '../models/user.model';
import apiClient from './client';

export const userApi = {
    getMe: () => apiClient.get<User>('/users/me'),
    getProfile: () => apiClient.get<UserProfile>('/users/me/profile'),
    updateProfile: (data: Partial<UserProfile>) =>
        apiClient.put<UserProfile>('/users/me/profile', data),
};

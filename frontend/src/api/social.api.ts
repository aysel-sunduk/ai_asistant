import type { Follow } from '../models/social.model';
import apiClient from './client';

export const socialApi = {
    getFollowers: () => apiClient.get<Follow[]>('/social/followers'),
    getFollowing: () => apiClient.get<Follow[]>('/social/following'),
    follow: (userId: string) => apiClient.post(`/social/follow/${userId}`),
    unfollow: (userId: string) => apiClient.delete(`/social/follow/${userId}`),
};

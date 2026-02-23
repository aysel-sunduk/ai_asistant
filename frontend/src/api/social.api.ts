// Kisa aciklama: Backend API cagrilarini toplar.
import type { ApiResponse } from '../models/auth.model';
import type {
    DiscoverUserItem,
    FollowItem,
    FollowRequestItem,
    FollowState,
    FollowStats,
    RequestStats,
    SocialPage,
} from '../models/social.model';
import apiClient from './client';

export const socialApi = {
    discoverUsers: (q?: string, page = 0, size = 20) =>
        apiClient.get<ApiResponse<SocialPage<DiscoverUserItem>>>('/v1/social/follows/discover', {
            params: { q, page, size },
        }),
    getFollowers: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<SocialPage<FollowItem>>>('/v1/social/follows/followers', {
            params: { page, size },
        }),
    getFollowing: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<SocialPage<FollowItem>>>('/v1/social/follows/following', {
            params: { page, size },
        }),
    getStats: () =>
        apiClient.get<ApiResponse<FollowStats>>('/v1/social/follows/stats'),
    getRequestStats: () =>
        apiClient.get<ApiResponse<RequestStats>>('/v1/social/follows/requests/stats'),
    getIncomingRequests: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<SocialPage<FollowRequestItem>>>('/v1/social/follows/requests/incoming', {
            params: { page, size },
        }),
    getOutgoingRequests: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<SocialPage<FollowRequestItem>>>('/v1/social/follows/requests/outgoing', {
            params: { page, size },
        }),
    getFollowState: (targetUserId: string) =>
        apiClient.get<ApiResponse<FollowState>>(`/v1/social/follows/state/${targetUserId}`),
    follow: (targetUserId: string) =>
        apiClient.post<ApiResponse<FollowState>>(`/v1/social/follows/${targetUserId}`),
    unfollow: (targetUserId: string) =>
        apiClient.delete<ApiResponse<FollowState>>(`/v1/social/follows/${targetUserId}`),
    acceptRequest: (requesterUserId: string) =>
        apiClient.post<ApiResponse<FollowState>>(`/v1/social/follows/requests/${requesterUserId}/accept`),
    rejectRequest: (requesterUserId: string) =>
        apiClient.post<ApiResponse<FollowState>>(`/v1/social/follows/requests/${requesterUserId}/reject`),
    withdrawRequest: (targetUserId: string) =>
        apiClient.post<ApiResponse<FollowState>>(`/v1/social/follows/requests/${targetUserId}/withdraw`),
};
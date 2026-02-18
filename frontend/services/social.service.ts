import { socialApi } from '../src/api/social.api';
import type {
    DiscoverUserItem,
    FollowItem,
    FollowRequestItem,
    FollowState,
    FollowStats,
    RequestStats,
    SocialPage,
} from '../src/models/social.model';

export const socialService = {
    discoverUsers: async (q?: string, page = 0, size = 20): Promise<SocialPage<DiscoverUserItem>> => {
        const response = await socialApi.discoverUsers(q, page, size);
        return response.data.data;
    },

    getFollowers: async (page = 0, size = 20): Promise<SocialPage<FollowItem>> => {
        const response = await socialApi.getFollowers(page, size);
        return response.data.data;
    },

    getFollowing: async (page = 0, size = 20): Promise<SocialPage<FollowItem>> => {
        const response = await socialApi.getFollowing(page, size);
        return response.data.data;
    },

    getStats: async (): Promise<FollowStats> => {
        const response = await socialApi.getStats();
        return response.data.data;
    },

    getRequestStats: async (): Promise<RequestStats> => {
        const response = await socialApi.getRequestStats();
        return response.data.data;
    },

    getIncomingRequests: async (page = 0, size = 20): Promise<SocialPage<FollowRequestItem>> => {
        const response = await socialApi.getIncomingRequests(page, size);
        return response.data.data;
    },

    getOutgoingRequests: async (page = 0, size = 20): Promise<SocialPage<FollowRequestItem>> => {
        const response = await socialApi.getOutgoingRequests(page, size);
        return response.data.data;
    },

    getFollowState: async (targetUserId: string): Promise<FollowState> => {
        const response = await socialApi.getFollowState(targetUserId);
        return response.data.data;
    },

    follow: async (targetUserId: string): Promise<FollowState> => {
        const response = await socialApi.follow(targetUserId);
        return response.data.data;
    },

    unfollow: async (targetUserId: string): Promise<FollowState> => {
        const response = await socialApi.unfollow(targetUserId);
        return response.data.data;
    },

    acceptRequest: async (requesterUserId: string): Promise<FollowState> => {
        const response = await socialApi.acceptRequest(requesterUserId);
        return response.data.data;
    },

    rejectRequest: async (requesterUserId: string): Promise<FollowState> => {
        const response = await socialApi.rejectRequest(requesterUserId);
        return response.data.data;
    },

    withdrawRequest: async (targetUserId: string): Promise<FollowState> => {
        const response = await socialApi.withdrawRequest(targetUserId);
        return response.data.data;
    },
};

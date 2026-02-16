import { socialApi } from '../src/api/social.api';
import type { Follow } from '../src/models/social.model';

export const socialService = {
    getFollowers: async (userId: string): Promise<Follow[]> => {
        const response = await socialApi.getFollowers(userId);
        return response.data;
    },

    getFollowing: async (userId: string): Promise<Follow[]> => {
        const response = await socialApi.getFollowing(userId);
        return response.data;
    },

    follow: async (userId: string): Promise<Follow> => {
        const response = await socialApi.follow(userId);
        return response.data;
    },

    unfollow: async (userId: string): Promise<void> => {
        await socialApi.unfollow(userId);
    },
};

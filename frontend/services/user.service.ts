import { userApi } from '../src/api/user.api';
import type { User, UserProfile } from '../src/models/user.model';

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await userApi.getProfile();
        return response.data;
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await userApi.updateProfile(data);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await userApi.getMe();
        return response.data;
    },
};

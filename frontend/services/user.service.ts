// Kisa aciklama: Servis akislarini yonetir.
import { userApi } from '../src/api/user.api';
import type { User, UserProfile } from '../src/models/user.model';

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await userApi.getProfile();
        return response.data.data;
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await userApi.updateProfile(data);
        return response.data.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await userApi.getMe();
        return response.data.data;
    },

    uploadProfilePicture: async (data: FormData): Promise<UserProfile> => {
        const response = await userApi.uploadProfilePicture(data);
        return response.data.data;
    },
};
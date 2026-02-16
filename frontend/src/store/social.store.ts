import { create } from 'zustand';
import type { Follow } from '../models/social.model';

interface SocialState {
    followers: Follow[];
    following: Follow[];
    isLoading: boolean;

    setFollowers: (followers: Follow[]) => void;
    setFollowing: (following: Follow[]) => void;
    addFollowing: (follow: Follow) => void;
    removeFollowing: (userId: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useSocialStore = create<SocialState>((set) => ({
    followers: [],
    following: [],
    isLoading: false,

    setFollowers: (followers) => set({ followers }),
    setFollowing: (following) => set({ following }),
    addFollowing: (follow) =>
        set((state) => ({ following: [...state.following, follow] })),
    removeFollowing: (userId) =>
        set((state) => ({
            following: state.following.filter((f) => f.followingId !== userId),
        })),
    setLoading: (isLoading) => set({ isLoading }),
}));

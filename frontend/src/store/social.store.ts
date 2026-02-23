// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { FollowItem } from '../models/social.model';

interface SocialState {
    followers: FollowItem[];
    following: FollowItem[];
    isLoading: boolean;

    setFollowers: (followers: FollowItem[]) => void;
    setFollowing: (following: FollowItem[]) => void;
    addFollowing: (follow: FollowItem) => void;
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
            following: state.following.filter((f) => f.user.userId !== userId),
        })),
    setLoading: (isLoading) => set({ isLoading }),
}));
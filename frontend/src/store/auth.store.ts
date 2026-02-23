// Kisa aciklama: Uygulama state yonetimini yapar.
import { create } from 'zustand';
import type { TokenResponse } from '../models/auth.model';
import type { User, UserProfile } from '../models/user.model';

interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setTokens: (tokens: TokenResponse) => void;
    setUser: (user: User) => void;
    setProfile: (profile: UserProfile) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,

    setTokens: (tokens) =>
        set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
        }),

    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),

    logout: () =>
        set({
            user: null,
            profile: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
        }),
}));
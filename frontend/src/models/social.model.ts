// Kisa aciklama: Destekleyici modul kodu icerir.
export interface SocialUserSummary {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface FollowState {
    targetUserId: string;
    following: boolean;
    relationStatus: 'following' | 'not_following' | 'pending_outgoing' | 'pending_incoming' | 'rejected' | string;
}

export interface FollowItem {
    user: SocialUserSummary;
    followedAt: string;
}

export interface FollowRequestItem {
    user: SocialUserSummary;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | string;
    requestedAt: string;
    updatedAt: string;
}

export interface FollowStats {
    followingCount: number;
    followersCount: number;
}

export interface RequestStats {
    incomingPendingCount: number;
}

export interface DiscoverUserItem {
    user: SocialUserSummary;
    following: boolean;
    relationStatus: 'following' | 'not_following' | 'pending_outgoing' | 'pending_incoming' | string;
    privateProfile: boolean;
}

export interface SocialPage<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}
// Kisa aciklama: Destekleyici modul kodu icerir.
export interface BlogPostRequest {
    title: string;
    rawContent: string;
    visibility?: 'private' | 'followers' | 'public' | string;
    status?: 'draft' | 'published' | 'archived' | string;
    tags?: string[];
}

export interface BlogComment {
    id: string;
    userId: string;
    authorEmail?: string;
    authorFirstName?: string;
    authorLastNameMasked?: string;
    authorDisplayName?: string;
    content: string;
    createdAt: string;
}

export interface LikedUser {
    userId: string;
    firstName: string;
    lastNameMasked: string;
    displayName: string;
}

export interface BlogPost {
    id: string;
    userId: string;
    title: string;
    rawContent: string;
    cleanContent?: string;
    visibility: string;
    status: string;
    tags: string[];
    likeCount: number;
    comments: BlogComment[];
    commentCount?: number;
    likedByMe?: boolean;
    likedUsers?: LikedUser[];
    createdAt: string;
    updatedAt: string;
}

export interface BlogPage {
    content: BlogPost[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface BlogTitleSuggestionRequest {
    content: string;
    category?: string;
    numSuggestions?: number;
}

export interface BlogTitleSuggestionResponse {
    suggestions: string[];
}
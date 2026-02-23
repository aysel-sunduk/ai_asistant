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
    content: string;
    createdAt: string;
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
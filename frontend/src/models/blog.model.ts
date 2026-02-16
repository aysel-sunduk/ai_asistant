export interface BlogPost {
    id: string;
    userId: string;
    title: string;
    content: string;
    summary?: string;
    coverImageUrl?: string;
    tags: string[];
    isPublished: boolean;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

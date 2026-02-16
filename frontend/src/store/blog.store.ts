import { create } from 'zustand';
import type { BlogPost, Comment } from '../models/blog.model';

interface BlogState {
    posts: BlogPost[];
    selectedPost: BlogPost | null;
    comments: Comment[];
    isLoading: boolean;

    setPosts: (posts: BlogPost[]) => void;
    setSelectedPost: (post: BlogPost | null) => void;
    setComments: (comments: Comment[]) => void;
    addPost: (post: BlogPost) => void;
    updatePost: (post: BlogPost) => void;
    removePost: (id: string) => void;
    addComment: (comment: Comment) => void;
    setLoading: (loading: boolean) => void;
}

export const useBlogStore = create<BlogState>((set) => ({
    posts: [],
    selectedPost: null,
    comments: [],
    isLoading: false,

    setPosts: (posts) => set({ posts }),
    setSelectedPost: (selectedPost) => set({ selectedPost }),
    setComments: (comments) => set({ comments }),
    addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
    updatePost: (post) =>
        set((state) => ({
            posts: state.posts.map((p) => (p.id === post.id ? post : p)),
        })),
    removePost: (id) =>
        set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
    addComment: (comment) =>
        set((state) => ({ comments: [...state.comments, comment] })),
    setLoading: (isLoading) => set({ isLoading }),
}));

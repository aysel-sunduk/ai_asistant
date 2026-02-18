import { blogApi } from '../src/api/blog.api';
import type { BlogPage, BlogPost, BlogPostRequest } from '../src/models/blog.model';

export const blogService = {
    getPosts: async (page = 0, size = 20): Promise<BlogPage> => {
        const response = await blogApi.getPosts(page, size);
        return response.data.data;
    },

    getFollowingFeed: async (page = 0, size = 20): Promise<BlogPage> => {
        const response = await blogApi.getFollowingFeed(page, size);
        return response.data.data;
    },

    getUserVisiblePosts: async (targetUserId: string, page = 0, size = 20): Promise<BlogPage> => {
        const response = await blogApi.getUserVisiblePosts(targetUserId, page, size);
        return response.data.data;
    },

    getPost: async (id: string): Promise<BlogPost> => {
        const response = await blogApi.getPost(id);
        return response.data.data;
    },

    createPost: async (data: BlogPostRequest): Promise<BlogPost> => {
        const response = await blogApi.createPost(data);
        return response.data.data;
    },

    updatePost: async (id: string, data: BlogPostRequest): Promise<BlogPost> => {
        const response = await blogApi.updatePost(id, data);
        return response.data.data;
    },

    deletePost: async (id: string): Promise<void> => {
        await blogApi.deletePost(id);
    },

    toggleLike: async (id: string): Promise<BlogPost> => {
        const response = await blogApi.toggleLike(id);
        return response.data.data;
    },

    addComment: async (id: string, content: string): Promise<BlogPost> => {
        const response = await blogApi.addComment(id, content);
        return response.data.data;
    },

    deleteComment: async (id: string, commentId: string): Promise<BlogPost> => {
        const response = await blogApi.deleteComment(id, commentId);
        return response.data.data;
    },

    cleanPost: async (id: string): Promise<BlogPost> => {
        const response = await blogApi.cleanPost(id);
        return response.data.data;
    },

    cleanPreview: async (content: string): Promise<{ originalContent: string; cleanContent: string }> => {
        const response = await blogApi.cleanPreview(content);
        return response.data.data;
    },
};

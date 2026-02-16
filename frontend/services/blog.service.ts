import { blogApi } from '../src/api/blog.api';
import type { BlogPost, Comment } from '../src/models/blog.model';

export const blogService = {
    getPosts: async (): Promise<BlogPost[]> => {
        const response = await blogApi.getPosts();
        return response.data;
    },

    getPost: async (id: string): Promise<BlogPost> => {
        const response = await blogApi.getPost(id);
        return response.data;
    },

    createPost: async (data: Partial<BlogPost>): Promise<BlogPost> => {
        const response = await blogApi.createPost(data);
        return response.data;
    },

    updatePost: async (id: string, data: Partial<BlogPost>): Promise<BlogPost> => {
        const response = await blogApi.updatePost(id, data);
        return response.data;
    },

    deletePost: async (id: string): Promise<void> => {
        await blogApi.deletePost(id);
    },

    // Yorumlar
    getComments: async (postId: string): Promise<Comment[]> => {
        const response = await blogApi.getComments(postId);
        return response.data;
    },

    addComment: async (postId: string, content: string): Promise<Comment> => {
        const response = await blogApi.addComment(postId, content);
        return response.data;
    },
};

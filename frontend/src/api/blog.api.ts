import type { BlogPost } from '../models/blog.model';
import apiClient from './client';

export const blogApi = {
    getPosts: (params?: Record<string, unknown>) => apiClient.get<BlogPost[]>('/blog/posts', { params }),
    getPost: (id: string) => apiClient.get<BlogPost>(`/blog/posts/${id}`),
    createPost: (data: Partial<BlogPost>) => apiClient.post<BlogPost>('/blog/posts', data),
    updatePost: (id: string, data: Partial<BlogPost>) => apiClient.put<BlogPost>(`/blog/posts/${id}`, data),
    deletePost: (id: string) => apiClient.delete(`/blog/posts/${id}`),
    likePost: (id: string) => apiClient.post(`/blog/posts/${id}/like`),
    addComment: (id: string, content: string) => apiClient.post(`/blog/posts/${id}/comments`, { content }),
};

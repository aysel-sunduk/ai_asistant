// Kisa aciklama: Backend API cagrilarini toplar.
import type { ApiResponse } from '../models/auth.model';
import type { BlogPage, BlogPost, BlogPostRequest } from '../models/blog.model';
import apiClient from './client';

export const blogApi = {
    getPosts: (page = 0, size = 20, sortBy = 'updatedAt', sortDirection: 'ASC' | 'DESC' = 'DESC') =>
        apiClient.get<ApiResponse<BlogPage>>('/v1/blog/posts', {
            params: { page, size, sortBy, sortDirection },
        }),
    getFollowingFeed: (page = 0, size = 20) =>
        apiClient.get<ApiResponse<BlogPage>>('/v1/blog/posts/feed/following', {
            params: { page, size },
        }),
    getUserVisiblePosts: (targetUserId: string, page = 0, size = 20, sortBy = 'updatedAt', sortDirection: 'ASC' | 'DESC' = 'DESC') =>
        apiClient.get<ApiResponse<BlogPage>>(`/v1/blog/posts/users/${targetUserId}`, {
            params: { page, size, sortBy, sortDirection },
        }),
    getPost: (id: string) => apiClient.get<ApiResponse<BlogPost>>(`/v1/blog/posts/${id}`),
    createPost: (data: BlogPostRequest) => apiClient.post<ApiResponse<BlogPost>>('/v1/blog/posts', data),
    updatePost: (id: string, data: BlogPostRequest) => apiClient.put<ApiResponse<BlogPost>>(`/v1/blog/posts/${id}`, data),
    deletePost: (id: string) => apiClient.delete<ApiResponse<void>>(`/v1/blog/posts/${id}`),
    toggleLike: (id: string) => apiClient.post<ApiResponse<BlogPost>>(`/v1/blog/posts/${id}/likes/toggle`),
    addComment: (id: string, content: string) => apiClient.post<ApiResponse<BlogPost>>(`/v1/blog/posts/${id}/comments`, { content }),
    deleteComment: (id: string, commentId: string) => apiClient.delete<ApiResponse<BlogPost>>(`/v1/blog/posts/${id}/comments/${commentId}`),
    cleanPost: (id: string) => apiClient.patch<ApiResponse<BlogPost>>(`/v1/blog/posts/${id}/clean`),
    cleanPreview: (content: string) => apiClient.post<ApiResponse<{ originalContent: string; cleanContent: string }>>('/v1/blog/posts/clean-preview', { content }),
    suggestTitles: (content: string, category = 'genel', numSuggestions = 3) =>
        apiClient.post<ApiResponse<string[]>>('/v1/blog/posts/suggest-title', {
            content,
            category,
            numSuggestions,
        }),
};
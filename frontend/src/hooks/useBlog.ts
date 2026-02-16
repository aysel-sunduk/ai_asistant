import { useCallback } from 'react';
import { blogService } from '../../services/blog.service';
import type { BlogPost } from '../models/blog.model';
import { useBlogStore } from '../store/blog.store';

export function useBlog() {
    const store = useBlogStore();

    const fetchPosts = useCallback(async () => {
        store.setLoading(true);
        try {
            const posts = await blogService.getPosts();
            store.setPosts(posts);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const fetchPost = useCallback(async (id: string) => {
        const post = await blogService.getPost(id);
        store.setSelectedPost(post);
        return post;
    }, []);

    const createPost = useCallback(async (data: Partial<BlogPost>) => {
        const post = await blogService.createPost(data);
        store.addPost(post);
        return post;
    }, []);

    const deletePost = useCallback(async (id: string) => {
        await blogService.deletePost(id);
        store.removePost(id);
    }, []);

    const fetchComments = useCallback(async (postId: string) => {
        const comments = await blogService.getComments(postId);
        store.setComments(comments);
    }, []);

    const addComment = useCallback(async (postId: string, content: string) => {
        const comment = await blogService.addComment(postId, content);
        store.addComment(comment);
        return comment;
    }, []);

    return {
        ...store,
        fetchPosts,
        fetchPost,
        createPost,
        deletePost,
        fetchComments,
        addComment,
    };
}

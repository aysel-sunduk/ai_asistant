// Kisa aciklama: Tekrar kullanilabilir hook mantigi icerir.
import { useCallback } from 'react';
import { blogService } from '../../services/blog.service';
import type { BlogPostRequest } from '../models/blog.model';
import { useBlogStore } from '../store/blog.store';

export function useBlog() {
    const store = useBlogStore();

    const fetchPosts = useCallback(async () => {
        store.setLoading(true);
        try {
            const page = await blogService.getPosts();
            store.setPosts(page.content || []);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const fetchPost = useCallback(async (id: string) => {
        const post = await blogService.getPost(id);
        store.setSelectedPost(post);
        return post;
    }, []);

    const createPost = useCallback(async (data: BlogPostRequest) => {
        const post = await blogService.createPost(data);
        store.addPost(post);
        return post;
    }, []);

    const deletePost = useCallback(async (id: string) => {
        await blogService.deletePost(id);
        store.removePost(id);
    }, []);

    return {
        ...store,
        fetchPosts,
        fetchPost,
        createPost,
        deletePost,
    };
}
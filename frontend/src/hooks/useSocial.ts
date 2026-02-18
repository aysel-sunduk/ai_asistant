import { useCallback } from 'react';
import { socialService } from '../../services/social.service';
import { useSocialStore } from '../store/social.store';

export function useSocial() {
    const store = useSocialStore();

    const fetchFollowers = useCallback(async () => {
        store.setLoading(true);
        try {
            const page = await socialService.getFollowers(0, 50);
            store.setFollowers(page.content || []);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const fetchFollowing = useCallback(async () => {
        const page = await socialService.getFollowing(0, 50);
        store.setFollowing(page.content || []);
    }, []);

    const follow = useCallback(async (userId: string) => {
        const state = await socialService.follow(userId);
        if (state.following) {
            await fetchFollowing();
        }
    }, []);

    const unfollow = useCallback(async (userId: string) => {
        await socialService.unfollow(userId);
        store.removeFollowing(userId);
    }, []);

    return {
        ...store,
        fetchFollowers,
        fetchFollowing,
        follow,
        unfollow,
    };
}

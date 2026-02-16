import { useCallback } from 'react';
import { socialService } from '../../services/social.service';
import { useSocialStore } from '../store/social.store';

export function useSocial() {
    const store = useSocialStore();

    const fetchFollowers = useCallback(async (userId: string) => {
        store.setLoading(true);
        try {
            const followers = await socialService.getFollowers(userId);
            store.setFollowers(followers);
        } finally {
            store.setLoading(false);
        }
    }, []);

    const fetchFollowing = useCallback(async (userId: string) => {
        const following = await socialService.getFollowing(userId);
        store.setFollowing(following);
    }, []);

    const follow = useCallback(async (userId: string) => {
        const f = await socialService.follow(userId);
        store.addFollowing(f);
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

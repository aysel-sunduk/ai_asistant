// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import UserProfileModal from '../../components/social/UserProfileModal';
import { blogService } from '../../services/blog.service';
import { socialService } from '../../services/social.service';
import type { BlogPost } from '../../src/models/blog.model';
import type { DiscoverUserItem, FollowRequestItem, FollowStats } from '../../src/models/social.model';

const COLOR = '#34D399';

const fullName = (firstName?: string, lastName?: string) => {
    const n = `${firstName || ''} ${lastName || ''}`.trim();
    return n || 'Kullanici';
};

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const relationLabel: Record<string, string> = {
    following: 'Takiptesin',
    pending_outgoing: 'Istek gonderildi',
    pending_incoming: 'Senden onay bekliyor',
    not_following: 'Takip etmiyorsun',
};

export default function FeedScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [stats, setStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });
    const [discoverUsers, setDiscoverUsers] = useState<DiscoverUserItem[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FollowRequestItem[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const openProfile = (userId: string) => {
        setSelectedUserId(userId);
        setProfileModalVisible(true);
    };

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const loadData = useCallback(async (query?: string) => {
        const q = query ?? searchText.trim();
        const [statsRes, discoverRes, incomingRes, feedRes] = await Promise.allSettled([
            socialService.getStats(),
            socialService.discoverUsers(q || undefined, 0, 20),
            socialService.getIncomingRequests(0, 10),
            blogService.getFollowingFeed(0, 20),
        ]);

        const failed: string[] = [];

        if (statsRes.status === 'fulfilled') {
            setStats(statsRes.value);
        } else {
            failed.push('istatistik');
        }

        if (discoverRes.status === 'fulfilled') {
            setDiscoverUsers(discoverRes.value.content || []);
        } else {
            setDiscoverUsers([]);
            failed.push('kesif');
        }

        if (incomingRes.status === 'fulfilled') {
            setIncomingRequests(incomingRes.value.content || []);
        } else {
            setIncomingRequests([]);
            failed.push('istekler');
        }

        if (feedRes.status === 'fulfilled') {
            setPosts(feedRes.value.content || []);
        } else {
            // Feed başarısız olursa sosyal keşif/istatistik akışını bloklama.
            // Bu endpoint bazı ortamlarda yetki nedeniyle 403 dönebildiği için
            // yalnızca feed'i boş gösteriyoruz.
            setPosts([]);
            const status = (feedRes.reason as any)?.response?.status;
            console.warn('[Social] Following feed request failed', status || '', feedRes.reason);
        }

        if (failed.length > 0) {
            showToast('error', `Bazi sosyal veriler alinamadi: ${failed.join(', ')}`);
        }
    }, [searchText]);

    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            setLoading(true);
            loadData()
                .finally(() => {
                    if (mounted) setLoading(false);
                });
            return () => {
                mounted = false;
            };
        }, [loadData]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const onSearchApply = async () => {
        setLoading(true);
        await loadData(searchText.trim());
        setLoading(false);
    };

    const handleFollowAction = async (user: DiscoverUserItem) => {
        const targetUserId = user.user.userId;
        setBusyUserId(targetUserId);
        try {
            if (user.relationStatus === 'following') {
                await socialService.unfollow(targetUserId);
            } else if (user.relationStatus === 'pending_outgoing') {
                await socialService.withdrawRequest(targetUserId);
            } else {
                await socialService.follow(targetUserId);
            }
            await loadData();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Islem basarisiz.');
        } finally {
            setBusyUserId(null);
        }
    };

    const handleIncomingRequest = async (requesterUserId: string, action: 'accept' | 'reject') => {
        setBusyUserId(requesterUserId);
        try {
            if (action === 'accept') {
                await socialService.acceptRequest(requesterUserId);
            } else {
                await socialService.rejectRequest(requesterUserId);
            }
            await loadData();
            showToast('success', action === 'accept' ? 'Takip istegi kabul edildi.' : 'Takip istegi reddedildi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Istek guncellenemedi.');
        } finally {
            setBusyUserId(null);
        }
    };

    const discoverTitle = useMemo(
        () => (searchText.trim() ? `"${searchText.trim()}" icin sonuclar` : 'Kullanici Kesfet'),
        [searchText],
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sosyal</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNum}>{stats.followingCount}</Text>
                        <Text style={styles.statLabel}>Takip</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNum}>{stats.followersCount}</Text>
                        <Text style={styles.statLabel}>Takipci</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNum}>{incomingRequests.length}</Text>
                        <Text style={styles.statLabel}>Bekleyen</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.searchWrap}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kullanici ara (ad veya email)"
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                        onSubmitEditing={onSearchApply}
                    />
                    <TouchableOpacity style={styles.searchBtn} onPress={onSearchApply}>
                        <Ionicons name="search" size={16} color={COLOR} />
                    </TouchableOpacity>
                </View>

                {incomingRequests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Gelen Takip Istekleri</Text>
                        {incomingRequests.map((r) => {
                            const name = fullName(r.user.firstName, r.user.lastName);
                            const isBusy = busyUserId === r.user.userId;
                            return (
                                <View key={r.user.userId} style={styles.requestCard}>
                                    <TouchableOpacity onPress={() => openProfile(r.user.userId)}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{initials(name)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openProfile(r.user.userId)}>
                                        <Text style={styles.cardTitle}>{name}</Text>
                                        <Text style={styles.cardSub}>{r.user.email}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={isBusy}
                                        style={styles.acceptBtn}
                                        onPress={() => handleIncomingRequest(r.user.userId, 'accept')}
                                    >
                                        <Text style={styles.acceptBtnText}>Kabul</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={isBusy}
                                        style={styles.rejectBtn}
                                        onPress={() => handleIncomingRequest(r.user.userId, 'reject')}
                                    >
                                        <Text style={styles.rejectBtnText}>Reddet</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{discoverTitle}</Text>
                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="small" color={COLOR} />
                        </View>
                    ) : discoverUsers.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyTitle}>Kullanici bulunamadi</Text>
                            <Text style={styles.emptySub}>Arama filtresini degistirebilirsin.</Text>
                        </View>
                    ) : (
                        discoverUsers.map((item) => {
                            const name = fullName(item.user.firstName, item.user.lastName);
                            const isBusy = busyUserId === item.user.userId;
                            const isFollowing = item.relationStatus === 'following';
                            const isPending = item.relationStatus === 'pending_outgoing';
                            const actionLabel = isFollowing
                                ? 'Birak'
                                : isPending
                                    ? 'Geri cek'
                                    : item.privateProfile
                                        ? 'Istek Gonder'
                                        : 'Takip Et';
                            return (
                                <View key={item.user.userId} style={styles.userCard}>
                                    <TouchableOpacity onPress={() => openProfile(item.user.userId)}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{initials(name)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openProfile(item.user.userId)}>
                                        <Text style={styles.cardTitle}>{name}</Text>
                                        <Text style={styles.cardSub}>{item.user.email}</Text>
                                        <Text style={styles.stateText}>
                                            {relationLabel[item.relationStatus] || item.relationStatus}
                                        </Text>
                                        <Text style={styles.visibilityText}>
                                            {item.privateProfile ? 'Hesap tipi: Ozel' : 'Hesap tipi: Herkese acik'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={isBusy}
                                        style={[
                                            styles.followBtn,
                                            isFollowing && styles.followBtnMuted,
                                            isPending && styles.followBtnPending,
                                        ]}
                                        onPress={() => handleFollowAction(item)}
                                    >
                                        <Text style={[styles.followBtnText, (isFollowing || isPending) && styles.followBtnTextMuted]}>
                                            {actionLabel}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.blogBtn}
                                        onPress={() => router.push({ pathname: '/(social)/user-profile', params: { userId: item.user.userId, name } })}
                                    >
                                        <Ionicons name="book-outline" size={16} color="#334155" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Takip Ettiklerinden Blog Akisi</Text>
                    {posts.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyTitle}>Feed bos</Text>
                            <Text style={styles.emptySub}>Takip ettigin kullanicilarin yayinladigi bloglar burada gorunur.</Text>
                        </View>
                    ) : (
                        posts.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                style={styles.postCard}
                                activeOpacity={0.85}
                                onPress={() => router.push({ pathname: '/(blog)/post-detail', params: { id: p.id } })}
                            >
                                <Text style={styles.postTitle}>{p.title}</Text>
                                <Text style={styles.postMeta}>
                                    {new Date(p.updatedAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={styles.postContent} numberOfLines={3}>
                                    {p.cleanContent || p.rawContent}
                                </Text>
                                <View style={styles.postFooter}>
                                    <View style={styles.metaBadge}>
                                        <Ionicons name="heart-outline" size={14} color="#64748B" />
                                        <Text style={styles.metaBadgeText}>{p.likeCount || 0}</Text>
                                    </View>
                                    <View style={styles.metaBadge}>
                                        <Ionicons name="chatbubble-outline" size={14} color="#64748B" />
                                        <Text style={styles.metaBadgeText}>{p.comments?.length || 0}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />

            <UserProfileModal
                visible={profileModalVisible}
                userId={selectedUserId}
                onClose={() => setProfileModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        marginTop: 16,
        paddingHorizontal: 18,
    },
    statItem: { alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
    statLabel: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
    statDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.25)' },
    scroll: { padding: 14, paddingBottom: 28 },
    searchWrap: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    searchInput: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    searchBtn: {
        width: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFEFD9',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: { marginTop: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    centered: { paddingVertical: 24, alignItems: 'center' },
    emptyBox: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 14,
    },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 10,
        marginBottom: 8,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 10,
        marginBottom: 8,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 99,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 12, fontWeight: '900', color: '#047857' },
    cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    cardSub: { marginTop: 1, fontSize: 11, color: '#64748B' },
    stateText: { marginTop: 3, fontSize: 11, color: '#0F766E', fontWeight: '600' },
    visibilityText: { marginTop: 2, fontSize: 11, color: '#64748B' },
    followBtn: {
        borderRadius: 10,
        backgroundColor: '#16A34A',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    followBtnMuted: { backgroundColor: '#E2E8F0' },
    followBtnPending: { backgroundColor: '#FCE7F3' },
    followBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    followBtnTextMuted: { color: '#334155' },
    blogBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtn: {
        borderRadius: 10,
        backgroundColor: '#DCFCE7',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    acceptBtnText: { color: '#166534', fontSize: 12, fontWeight: '800' },
    rejectBtn: {
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    rejectBtnText: { color: '#B91C1C', fontSize: 12, fontWeight: '800' },
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginBottom: 8,
    },
    postTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    postMeta: { marginTop: 4, fontSize: 11, color: '#64748B' },
    postContent: { marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 18 },
    postFooter: { marginTop: 10, flexDirection: 'row', gap: 8 },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    metaBadgeText: { fontSize: 11, color: '#475569', fontWeight: '700' },
});
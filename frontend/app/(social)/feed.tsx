// Kisa aciklama: Sosyal + Blog entegrasyonu. Kesfet / Bloglar / Yaz sekmeleri.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
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

const COLOR = '#6C63FF';

type TabKey = 'discover' | 'blogs' | 'write';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'discover', label: 'Kesfet', icon: 'compass-outline' },
    { key: 'blogs', label: 'Bloglar', icon: 'newspaper-outline' },
    { key: 'write', label: 'Yaz', icon: 'create-outline' },
];

const VISIBILITY_OPTIONS = ['private', 'followers', 'public'] as const;
const STATUS_OPTIONS = ['draft', 'published'] as const;
const PROFANITY_WARNING = 'Argo kelime kullandiniz, paylasim iptal edildi.';

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
    const [activeTab, setActiveTab] = useState<TabKey>('discover');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ─── Social states ───
    const [searchText, setSearchText] = useState('');
    const [stats, setStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });
    const [discoverUsers, setDiscoverUsers] = useState<DiscoverUserItem[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FollowRequestItem[]>([]);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);
    const [discoverPage, setDiscoverPage] = useState(0);
    const [discoverTotalPages, setDiscoverTotalPages] = useState(1);

    // ─── Blog feed states ───
    const [feedPosts, setFeedPosts] = useState<BlogPost[]>([]);

    // ─── Blog write states ───
    const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>('public');
    const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('published');
    const [saving, setSaving] = useState(false);

    // ─── AI states ───
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // ─── Toast & Profile ───
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

    // ─── AI Proactive Trigger ───
    useEffect(() => {
        if (content.length < 50) {
            setHasNewSuggestions(false);
            return;
        }
        const timer = setTimeout(async () => {
            setAiLoading(true);
            try {
                const results = await blogService.suggestTitles(content);
                if (results && results.length > 0) {
                    setAiSuggestions(results);
                    setHasNewSuggestions(true);
                    Animated.sequence([
                        Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
                        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    ]).start();
                }
            } catch (err) {
                console.warn('AI suggestions failed', err);
            } finally {
                setAiLoading(false);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [content]);

    // ─── Data Loading ───
    const loadSocialData = useCallback(async (query?: string) => {
        const q = query ?? searchText.trim();
        const [statsRes, discoverRes, incomingRes] = await Promise.allSettled([
            socialService.getStats(),
            socialService.discoverUsers(q || undefined, discoverPage, 5),
            socialService.getIncomingRequests(0, 10),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (discoverRes.status === 'fulfilled') {
            setDiscoverUsers(discoverRes.value.content || []);
            setDiscoverTotalPages(discoverRes.value.totalPages || 1);
        } else {
            setDiscoverUsers([]);
            setDiscoverTotalPages(1);
        }
        if (incomingRes.status === 'fulfilled') {
            setIncomingRequests(incomingRes.value.content || []);
        } else {
            setIncomingRequests([]);
        }
    }, [searchText, discoverPage]);

    const loadBlogFeed = useCallback(async () => {
        try {
            const page = await blogService.getFollowingFeed(0, 20);
            setFeedPosts(page.content || []);
        } catch {
            setFeedPosts([]);
        }
    }, []);

    const loadMyPosts = useCallback(async () => {
        try {
            const page = await blogService.getPosts(0, 30);
            setMyPosts(page.content || []);
        } catch {
            setMyPosts([]);
        }
    }, []);

    const loadAll = useCallback(async () => {
        await Promise.allSettled([loadSocialData(), loadBlogFeed(), loadMyPosts()]);
    }, [loadSocialData, loadBlogFeed, loadMyPosts]);

    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            setLoading(true);
            loadAll().finally(() => {
                if (mounted) setLoading(false);
            });
            return () => { mounted = false; };
        }, [loadAll]),
    );

    // Re-fetch discover when page changes
    useEffect(() => {
        loadSocialData();
    }, [discoverPage]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    const onSearchApply = async () => {
        setDiscoverPage(0);
        setLoading(true);
        await loadSocialData(searchText.trim());
        setLoading(false);
    };

    // ─── Social Actions ───
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
            await loadSocialData();
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
            await loadSocialData();
            showToast('success', action === 'accept' ? 'Takip istegi kabul edildi.' : 'Takip istegi reddedildi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Istek guncellenemedi.');
        } finally {
            setBusyUserId(null);
        }
    };

    // ─── Blog Actions ───
    const resolveBlogErrorMessage = (error: any, fallback: string) => {
        const backendMessage: string | undefined = error?.response?.data?.message;
        if (backendMessage?.toLowerCase().includes('argo kelime')) return PROFANITY_WARNING;
        return backendMessage || fallback;
    };

    const submitPost = async () => {
        const normalizedTitle = title.trim();
        const normalizedContent = content.trim();
        if (!normalizedTitle || !normalizedContent) {
            showToast('error', 'Baslik ve icerik zorunlu.');
            return;
        }
        if (normalizedTitle.length < 3) { showToast('error', 'Baslik en az 3 karakter olmali.'); return; }
        if (normalizedContent.length < 10) { showToast('error', 'Icerik en az 10 karakter olmali.'); return; }
        if (normalizedContent.length > 10000) { showToast('error', 'Icerik en fazla 10000 karakter olmali.'); return; }
        setSaving(true);
        try {
            await blogService.createPost({
                title: normalizedTitle,
                rawContent: normalizedContent,
                visibility,
                status,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            });
            setTitle('');
            setContent('');
            setTags('');
            showToast('success', 'Blog yazisi kaydedildi.');
            await loadMyPosts();
        } catch (error: any) {
            const message = resolveBlogErrorMessage(error, 'Blog kaydi basarisiz.');
            showToast('error', message.includes('rawContent') ? 'Icerik 10-10000 karakter araliginda olmali.' : message);
        } finally {
            setSaving(false);
        }
    };

    const onDeletePost = (id: string) => {
        Alert.alert('Blogu sil', 'Bu yaziyi silmek istiyor musun?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await blogService.deletePost(id);
                        showToast('success', 'Blog yazisi silindi.');
                        await loadMyPosts();
                    } catch (error: any) {
                        showToast('error', resolveBlogErrorMessage(error, 'Blog silinemedi.'));
                    }
                },
            },
        ]);
    };

    const visibilityLabel = (v: string) => (v === 'private' ? 'Ozel' : v === 'followers' ? 'Takipciler' : 'Herkese Acik');
    const statusLabel = (s: string) => (s === 'draft' ? 'Taslak' : 'Yayin');

    const discoverTitle = useMemo(
        () => (searchText.trim() ? `"${searchText.trim()}" icin sonuclar` : 'Kullanici Kesfet'),
        [searchText],
    );

    // ═══════════════════════════════ RENDER ═══════════════════════════════

    const renderDiscoverTab = () => (
        <>
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
                            <View key={r.user.userId} style={styles.userCard}>
                                <TouchableOpacity onPress={() => openProfile(r.user.userId)}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{initials(name)}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ flex: 1 }} onPress={() => openProfile(r.user.userId)}>
                                    <Text style={styles.cardTitle}>{name}</Text>
                                    <Text style={styles.cardSub}>{r.user.email}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={isBusy} style={styles.acceptBtn} onPress={() => handleIncomingRequest(r.user.userId, 'accept')}>
                                    <Text style={styles.acceptBtnText}>Kabul</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={isBusy} style={styles.rejectBtn} onPress={() => handleIncomingRequest(r.user.userId, 'reject')}>
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
                                    style={styles.profileBtn}
                                    onPress={() => router.push({ pathname: '/(social)/user-profile', params: { userId: item.user.userId, name } })}
                                >
                                    <Ionicons name="person-outline" size={16} color="#475569" />
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}

                {discoverTotalPages > 1 && discoverUsers.length > 0 && (
                    <View style={styles.paginationRow}>
                        <TouchableOpacity
                            style={[styles.pageBtn, discoverPage === 0 && styles.pageBtnDisabled]}
                            onPress={() => setDiscoverPage((p) => Math.max(0, p - 1))}
                            disabled={discoverPage === 0 || loading}
                        >
                            <Ionicons name="chevron-back" size={16} color={discoverPage === 0 ? '#94A3B8' : COLOR} />
                            <Text style={[styles.pageBtnText, discoverPage === 0 && styles.pageBtnTextDisabled]}>Geri</Text>
                        </TouchableOpacity>
                        <Text style={styles.pageIndicator}>{discoverPage + 1} / {discoverTotalPages}</Text>
                        <TouchableOpacity
                            style={[styles.pageBtn, discoverPage >= discoverTotalPages - 1 && styles.pageBtnDisabled]}
                            onPress={() => setDiscoverPage((p) => Math.min(discoverTotalPages - 1, p + 1))}
                            disabled={discoverPage >= discoverTotalPages - 1 || loading}
                        >
                            <Text style={[styles.pageBtnText, discoverPage >= discoverTotalPages - 1 && styles.pageBtnTextDisabled]}>Ileri</Text>
                            <Ionicons name="chevron-forward" size={16} color={discoverPage >= discoverTotalPages - 1 ? '#94A3B8' : COLOR} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    );

    const renderBlogsTab = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takip Ettiklerinden</Text>
            {feedPosts.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Feed bos</Text>
                    <Text style={styles.emptySub}>Takip ettigin kullanicilarin bloglar burada gorunur.</Text>
                </View>
            ) : (
                feedPosts.map((p) => (
                    <TouchableOpacity
                        key={p.id}
                        style={styles.postCard}
                        activeOpacity={0.85}
                        onPress={() => router.push({ pathname: '/(social)/post-detail', params: { id: p.id } })}
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
    );

    const renderWriteTab = () => (
        <>
            <View style={styles.formCard}>
                <Text style={styles.formTitle}>Yeni Yazi</Text>
                <View style={styles.titleInputRow}>
                    <TextInput placeholder="Baslik" value={title} onChangeText={setTitle} style={[styles.input, { flex: 1, marginTop: 0 }]} />
                    {hasNewSuggestions && (
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity style={styles.aiMagicBtn} onPress={() => setShowAiModal(true)}>
                                <Ionicons name="sparkles" size={20} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
                <TextInput placeholder="Icerik" value={content} onChangeText={setContent} style={[styles.input, styles.textarea]} multiline />
                <TextInput placeholder="Etiketler (virgulle)" value={tags} onChangeText={setTags} style={styles.input} />

                <Text style={styles.fieldLabel}>Gorunurluk</Text>
                <View style={styles.optionRow}>
                    {VISIBILITY_OPTIONS.map((v) => (
                        <TouchableOpacity key={v} style={[styles.optionChip, visibility === v && styles.optionChipActive]} onPress={() => setVisibility(v)}>
                            <Text style={[styles.optionText, visibility === v && styles.optionTextActive]}>{visibilityLabel(v)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.fieldLabel}>Durum</Text>
                <View style={styles.optionRow}>
                    {STATUS_OPTIONS.map((s) => (
                        <TouchableOpacity key={s} style={[styles.optionChip, status === s && styles.optionChipActive]} onPress={() => setStatus(s)}>
                            <Text style={[styles.optionText, status === s && styles.optionTextActive]}>{statusLabel(s)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.75 }]} onPress={submitPost} disabled={saving}>
                    <Ionicons name="send" size={15} color="#fff" />
                    <Text style={styles.submitBtnText}>{saving ? 'Kaydediliyor...' : 'Paylas'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Benim Bloglarim</Text>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="small" color={COLOR} />
                </View>
            ) : myPosts.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Kayit yok</Text>
                    <Text style={styles.emptySub}>Ilk blogunu yukaridan olusturabilirsin.</Text>
                </View>
            ) : (
                myPosts.map((p) => (
                    <View key={p.id} style={styles.postCard}>
                        <View style={styles.postHeaderRow}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push({ pathname: '/(social)/post-detail', params: { id: p.id } })}>
                                <Text style={styles.postTitle}>{p.title}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.postDeleteBtn} onPress={() => onDeletePost(p.id)}>
                                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.postMeta}>
                            {statusLabel(p.status)} | {visibilityLabel(p.visibility)} | {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
                        </Text>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push({ pathname: '/(social)/post-detail', params: { id: p.id } })}>
                            <Text style={styles.postContent} numberOfLines={3}>{p.cleanContent || p.rawContent}</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </>
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

            {/* ─── Tab Bar ─── */}
            <View style={styles.tabBar}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? COLOR : '#94A3B8'} />
                        <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'discover' && renderDiscoverTab()}
                {activeTab === 'blogs' && renderBlogsTab()}
                {activeTab === 'write' && renderWriteTab()}
            </ScrollView>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
            <UserProfileModal visible={profileModalVisible} userId={selectedUserId} onClose={() => setProfileModalVisible(false)} />

            {/* AI Suggestions Modal */}
            <Modal visible={showAiModal} transparent animationType="slide" onRequestClose={() => setShowAiModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>✨ AI Baslik Onerileri</Text>
                            <TouchableOpacity onPress={() => setShowAiModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSub}>Icerigne gore en uygun basliklar burada:</Text>
                        {aiLoading ? (
                            <ActivityIndicator style={{ margin: 20 }} color={COLOR} />
                        ) : (
                            <ScrollView style={styles.suggestionList}>
                                {aiSuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionItem}
                                        onPress={() => {
                                            setTitle(suggestion);
                                            setShowAiModal(false);
                                            setHasNewSuggestions(false);
                                        }}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                        <Ionicons name="chevron-forward" size={16} color={COLOR} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        marginTop: 20,
        paddingHorizontal: 18,
    },
    statItem: { alignItems: 'center' },
    statNum: { fontSize: 24, fontWeight: '900', color: '#fff' },
    statLabel: { marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },

    // ─── Tab Bar ───
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 4,
        paddingHorizontal: 12,
        marginTop: -14,
        marginHorizontal: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
        borderRadius: 12,
    },
    tabItemActive: {
        backgroundColor: COLOR + '14',
    },
    tabLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
    tabLabelActive: { color: COLOR },

    scroll: { padding: 18, paddingTop: 20, paddingBottom: 40 },

    // ─── Search ───
    searchWrap: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    searchInput: {
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    searchBtn: {
        width: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },

    // ─── Sections ───
    section: { marginTop: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12, letterSpacing: -0.3 },
    centered: { paddingVertical: 30, alignItems: 'center' },
    emptyBox: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    emptySub: { marginTop: 6, fontSize: 13, color: '#64748B', textAlign: 'center' },

    // ─── User Cards ───
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 14,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 99,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 14, fontWeight: '800', color: '#6C63FF' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
    cardSub: { marginTop: 2, fontSize: 12, color: '#64748B' },
    stateText: { marginTop: 4, fontSize: 12, color: '#6C63FF', fontWeight: '600' },
    visibilityText: { marginTop: 2, fontSize: 11, color: '#94A3B8' },
    followBtn: {
        borderRadius: 12,
        backgroundColor: COLOR,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    followBtnMuted: { backgroundColor: '#F1F5F9' },
    followBtnPending: { backgroundColor: '#FDF2F8' },
    followBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    followBtnTextMuted: { color: '#475569' },
    profileBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtn: {
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    acceptBtnText: { color: '#059669', fontSize: 13, fontWeight: '800' },
    rejectBtn: {
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    rejectBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },

    // ─── Pagination ───
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 16,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#EDE9FE',
    },
    pageBtnDisabled: { backgroundColor: '#F1F5F9' },
    pageBtnText: { fontSize: 13, fontWeight: '800', color: COLOR },
    pageBtnTextDisabled: { color: '#94A3B8' },
    pageIndicator: { fontSize: 14, fontWeight: '700', color: '#64748B' },

    // ─── Post Cards ───
    postCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    postHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    postTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
    postMeta: { marginTop: 6, fontSize: 12, color: '#94A3B8' },
    postContent: { marginTop: 10, fontSize: 14, color: '#475569', lineHeight: 22 },
    postFooter: { marginTop: 14, flexDirection: 'row', gap: 10 },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    metaBadgeText: { fontSize: 12, color: '#475569', fontWeight: '700' },
    postDeleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ─── Blog Form ───
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    formTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
    titleInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    aiMagicBtn: {
        backgroundColor: '#FFD700',
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    input: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: '#0F172A',
    },
    textarea: { minHeight: 110, textAlignVertical: 'top' },
    fieldLabel: { marginTop: 12, fontSize: 12, fontWeight: '700', color: '#475569' },
    optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
    optionChip: { backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    optionChipActive: { backgroundColor: COLOR },
    optionText: { color: '#334155', fontSize: 12, fontWeight: '700' },
    optionTextActive: { color: '#fff' },
    submitBtn: {
        marginTop: 14,
        backgroundColor: COLOR,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    // ─── AI Modal ───
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    modalSub: { fontSize: 13, color: '#64748B', marginBottom: 15 },
    suggestionList: { marginBottom: 20 },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    suggestionText: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1, marginRight: 10 },
});
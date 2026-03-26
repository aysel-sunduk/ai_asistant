// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { blogService } from '../../services/blog.service';
import type { BlogPost } from '../../src/models/blog.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#6C63FF';

const visibilityLabel = (v: string) => (v === 'private' ? 'Ozel' : v === 'followers' ? 'Takipciler' : 'Herkese Acik');
const statusLabel = (s: string) => (s === 'draft' ? 'Taslak' : s === 'archived' ? 'Arsiv' : 'Yayin');

export default function BlogTabScreen() {
    const router = useRouter();
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';
    const [loading, setLoading] = useState(true);
    const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
    const [feedPosts, setFeedPosts] = useState<BlogPost[]>([]);
    const [activeTab, setActiveTab] = useState<'MY' | 'FOLLOWING'>('MY');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error');
    const [toastMessage, setToastMessage] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [myPage, feedPage] = await Promise.allSettled([
                blogService.getPosts(0, 20),
                blogService.getFollowingFeed(0, 20),
            ]);
            if (myPage.status === 'fulfilled') {
                setMyPosts(myPage.value.content || []);
            } else {
                setMyPosts([]);
            }
            if (feedPage.status === 'fulfilled') {
                setFeedPosts(feedPage.value.content || []);
            } else {
                setFeedPosts([]);
            }
            if (myPage.status === 'rejected' && feedPage.status === 'rejected') {
                showToast('error', 'Blog verileri alinamadi.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const onDeletePost = (id: string) => {
        Alert.alert('Blogu sil', 'Bu yaziyi silmek istiyor musun?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    setDeletingId(id);
                    try {
                        await blogService.deletePost(id);
                        showToast('success', 'Blog yazisi silindi.');
                        await load();
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Blog silinemedi.');
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    const visiblePosts = activeTab === 'MY' ? myPosts : feedPosts;

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bloglar</Text>
                    <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(blog)/create-post')}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.createBtnText}>Olustur</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                    </View>
                ) : (
                    <>
                        <View style={styles.tabRow}>
                            <TouchableOpacity
                                style={[styles.tabBtn, activeTab === 'MY' && styles.tabBtnActive]}
                                onPress={() => setActiveTab('MY')}
                            >
                                <Text style={[styles.tabBtnText, activeTab === 'MY' && styles.tabBtnTextActive]}>
                                    Benim Bloglarım ({myPosts.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabBtn, activeTab === 'FOLLOWING' && styles.tabBtnActive]}
                                onPress={() => setActiveTab('FOLLOWING')}
                            >
                                <Text style={[styles.tabBtnText, activeTab === 'FOLLOWING' && styles.tabBtnTextActive]}>
                                    Takip Ettiklerim ({feedPosts.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {visiblePosts.length === 0 ? (
                            <View style={[styles.emptyCard, isDark && styles.cardDark]}>
                                <Text style={[styles.emptyTitle, isDark && styles.titleDark]}>
                                    {activeTab === 'MY' ? 'Kayit yok' : 'Feed bos'}
                                </Text>
                                <Text style={[styles.emptySub, isDark && styles.subDark]}>
                                    {activeTab === 'MY'
                                        ? 'Sag ustteki Olustur ile ilk blogunu yaz.'
                                        : 'Takip ettigin hesaplar yazi paylastiginda burada gorulur.'}
                                </Text>
                            </View>
                        ) : (
                            visiblePosts.map((p) => (
                                <View key={p.id} style={[styles.card, isDark && styles.cardDark]}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={[styles.cardTitle, isDark && styles.titleDark]}>{p.title}</Text>
                                        {activeTab === 'MY' ? (
                                            <TouchableOpacity
                                                style={styles.deleteBtn}
                                                onPress={() => onDeletePost(p.id)}
                                                disabled={deletingId === p.id}
                                            >
                                                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                    <Text style={[styles.cardMeta, isDark && styles.subDark]}>
                                        {statusLabel(p.status)}
                                        {activeTab === 'MY' ? ` | ${visibilityLabel(p.visibility)}` : ''}
                                        {' | '}
                                        {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
                                    </Text>
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => router.push({ pathname: '/(blog)/post-detail', params: { id: p.id } })}
                                    >
                                        <Text numberOfLines={3} style={[styles.cardBody, isDark && styles.bodyDark]}>
                                            {p.cleanContent || p.rawContent}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    containerDark: { backgroundColor: '#0B1220' },
    header: { backgroundColor: COLOR, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 16 },
    headerRow: {
        paddingTop: Platform.OS === 'ios' ? 58 : 40,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
    createBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    content: { padding: 14, paddingBottom: 28 },
    centered: { alignItems: 'center', paddingVertical: 44 },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    tabBtn: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    tabBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
    tabBtnTextActive: { color: COLOR },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
    emptyCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 8 },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 8 },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cardTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    titleDark: { color: '#E5E7EB' },
    deleteBtn: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardMeta: { marginTop: 4, fontSize: 11, color: '#64748B' },
    cardBody: { marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 18 },
    subDark: { color: '#94A3B8' },
    bodyDark: { color: '#CBD5E1' },
});

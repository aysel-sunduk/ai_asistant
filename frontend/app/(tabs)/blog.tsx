// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
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

const COLOR = '#6C63FF';

const visibilityLabel = (v: string) => (v === 'private' ? 'Ozel' : v === 'followers' ? 'Takipciler' : 'Herkese Acik');
const statusLabel = (s: string) => (s === 'draft' ? 'Taslak' : s === 'archived' ? 'Arsiv' : 'Yayin');

export default function BlogTabScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [myPosts, setMyPosts] = useState<BlogPost[]>([]);
    const [feedPosts, setFeedPosts] = useState<BlogPost[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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
                setToastMessage('Blog verileri alinamadi.');
                setToastVisible(true);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Blog</Text>
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
                        <Text style={styles.sectionTitle}>Benim Bloglarim</Text>
                        {myPosts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>Kayit yok</Text>
                                <Text style={styles.emptySub}>Sag ustteki Olustur ile ilk blogunu yaz.</Text>
                            </View>
                        ) : (
                            myPosts.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.card}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({ pathname: '/(blog)/post-detail', params: { id: p.id } })}
                                >
                                    <Text style={styles.cardTitle}>{p.title}</Text>
                                    <Text style={styles.cardMeta}>
                                        {statusLabel(p.status)} | {visibilityLabel(p.visibility)} | {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
                                    </Text>
                                    <Text numberOfLines={3} style={styles.cardBody}>
                                        {p.cleanContent || p.rawContent}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}

                        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Takip Ettiklerinden</Text>
                        {feedPosts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyTitle}>Feed bos</Text>
                                <Text style={styles.emptySub}>Takip ettigin hesaplar yazi paylastiginda burada gorulur.</Text>
                            </View>
                        ) : (
                            feedPosts.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.card}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({ pathname: '/(blog)/post-detail', params: { id: p.id } })}
                                >
                                    <Text style={styles.cardTitle}>{p.title}</Text>
                                    <Text style={styles.cardMeta}>
                                        {statusLabel(p.status)} | {new Date(p.updatedAt).toLocaleString('tr-TR')}
                                    </Text>
                                    <Text numberOfLines={3} style={styles.cardBody}>
                                        {p.cleanContent || p.rawContent}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}
            </ScrollView>

            <Toast visible={toastVisible} type="error" message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { backgroundColor: COLOR, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 16 },
    headerRow: {
        paddingTop: Platform.OS === 'ios' ? 58 : 40,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
    createBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    content: { padding: 14, paddingBottom: 28 },
    centered: { alignItems: 'center', paddingVertical: 44 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
    emptyCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 8 },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, marginBottom: 8 },
    cardTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
    cardMeta: { marginTop: 4, fontSize: 11, color: '#64748B' },
    cardBody: { marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 18 },
});
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from '../../components/ui/Toast';
import { blogService } from '../../services/blog.service';
import type { BlogPost } from '../../src/models/blog.model';

const COLOR = '#34D399';

export default function UserProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId?: string; name?: string }>();
    const userId = params.userId;
    const name = useMemo(() => (params.name ? String(params.name) : 'Kullanici'), [params.name]);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const run = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const page = await blogService.getUserVisiblePosts(String(userId), 0, 30);
                setPosts(page.content || []);
            } catch (error: any) {
                setToastMessage(error?.response?.data?.message || 'Kullanici bloglari alinamadi.');
                setToastVisible(true);
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [userId]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{name}</Text>
                    <View style={styles.backBtn} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="small" color={COLOR} />
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Yayinlanmis yazi yok</Text>
                        <Text style={styles.emptySub}>Bu kullanicinin gormeye acik bloglari burada listelenir.</Text>
                    </View>
                ) : (
                    posts.map((p) => (
                        <View key={p.id} style={styles.card}>
                            <Text style={styles.title}>{p.title}</Text>
                            <Text style={styles.meta}>
                                {new Date(p.updatedAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text style={styles.body} numberOfLines={4}>
                                {p.cleanContent || p.rawContent}
                            </Text>
                        </View>
                    ))
                )}
            </ScrollView>

            <Toast
                visible={toastVisible}
                type="error"
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 20 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', maxWidth: 220 },
    content: { padding: 14, paddingBottom: 24 },
    centered: { alignItems: 'center', paddingVertical: 30 },
    emptyCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 8 },
    title: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    meta: { marginTop: 4, fontSize: 11, color: '#64748B' },
    body: { marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 18 },
});

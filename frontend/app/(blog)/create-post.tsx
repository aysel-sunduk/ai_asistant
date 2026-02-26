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
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Animated,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { blogService } from '../../services/blog.service';
import type { BlogPost } from '../../src/models/blog.model';
import { useEffect, useRef } from 'react';

const COLOR = '#6C63FF';

const VISIBILITY_OPTIONS = ['private', 'followers', 'public'] as const;
const STATUS_OPTIONS = ['draft', 'published'] as const;
const PROFANITY_WARNING = 'Argo kelime kullandiniz, paylasim iptal edildi.';

export default function CreatePostScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>('public');
    const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('published');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    // AI States
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Proactive AI Trigger (Debounced)
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
                    startPulse();
                }
            } catch (err) {
                console.warn('AI suggestions failed', err);
            } finally {
                setAiLoading(false);
            }
        }, 2000); // 2 saniye bekle

        return () => clearTimeout(timer);
    }, [content]);

    const startPulse = () => {
        Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    };

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const resolveBlogErrorMessage = (error: any, fallback: string) => {
        const backendMessage: string | undefined = error?.response?.data?.message;
        if (backendMessage?.toLowerCase().includes('argo kelime')) {
            return PROFANITY_WARNING;
        }
        return backendMessage || fallback;
    };

    const loadPosts = useCallback(async () => {
        try {
            const page = await blogService.getPosts(0, 30);
            setPosts(page.content || []);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Bloglar alinamadi.');
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            let mounted = true;
            setLoading(true);
            loadPosts().finally(() => {
                if (mounted) setLoading(false);
            });
            return () => {
                mounted = false;
            };
        }, [loadPosts]),
    );

    const submit = async () => {
        const normalizedTitle = title.trim();
        const normalizedContent = content.trim();
        if (!normalizedTitle || !normalizedContent) {
            showToast('error', 'Baslik ve icerik zorunlu.');
            return;
        }
        if (normalizedTitle.length < 3) {
            showToast('error', 'Baslik en az 3 karakter olmali.');
            return;
        }
        if (normalizedContent.length < 10) {
            showToast('error', 'Icerik en az 10 karakter olmali.');
            return;
        }
        if (normalizedContent.length > 10000) {
            showToast('error', 'Icerik en fazla 10000 karakter olmali.');
            return;
        }
        setSaving(true);
        try {
            await blogService.createPost({
                title: normalizedTitle,
                rawContent: normalizedContent,
                visibility,
                status,
                tags: tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
            });
            setTitle('');
            setContent('');
            setTags('');
            showToast('success', 'Blog yazisi kaydedildi.');
            await loadPosts();
        } catch (error: any) {
            const message = resolveBlogErrorMessage(error, 'Blog kaydi basarisiz.');
            if (message.includes('rawContent')) {
                showToast('error', 'Icerik 10-10000 karakter araliginda olmali.');
            } else {
                showToast('error', message);
            }
        } finally {
            setSaving(false);
        }
    };

    const visibilityLabel = (v: string) => (v === 'private' ? 'Ozel' : v === 'followers' ? 'Takipciler' : 'Herkese Acik');
    const statusLabel = (s: string) => (s === 'draft' ? 'Taslak' : 'Yayin');

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
                        await loadPosts();
                    } catch (error: any) {
                        showToast('error', resolveBlogErrorMessage(error, 'Blog silinemedi.'));
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Blog Paylas</Text>
                    <View style={styles.headerBtn} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Yeni Yazi</Text>
                    <View style={styles.titleContainer}>
                        <TextInput
                            placeholder="Baslik"
                            value={title}
                            onChangeText={setTitle}
                            style={[styles.input, { flex: 1, marginTop: 0 }]}
                        />
                        {hasNewSuggestions && (
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <TouchableOpacity
                                    style={styles.aiMagicBtn}
                                    onPress={() => setShowAiModal(true)}
                                >
                                    <Ionicons name="sparkles" size={20} color="#fff" />
                                </TouchableOpacity>
                            </Animated.View>
                        )}
                    </View>
                    <TextInput
                        placeholder="Icerik"
                        value={content}
                        onChangeText={setContent}
                        style={[styles.input, styles.textarea]}
                        multiline
                    />
                    <TextInput
                        placeholder="Etiketler (virgulle)"
                        value={tags}
                        onChangeText={setTags}
                        style={styles.input}
                    />

                    <Text style={styles.fieldLabel}>Gorunurluk</Text>
                    <View style={styles.optionRow}>
                        {VISIBILITY_OPTIONS.map((v) => (
                            <TouchableOpacity
                                key={v}
                                style={[styles.optionChip, visibility === v && styles.optionChipActive]}
                                onPress={() => setVisibility(v)}
                            >
                                <Text style={[styles.optionText, visibility === v && styles.optionTextActive]}>{visibilityLabel(v)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.fieldLabel}>Durum</Text>
                    <View style={styles.optionRow}>
                        {STATUS_OPTIONS.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.optionChip, status === s && styles.optionChipActive]}
                                onPress={() => setStatus(s)}
                            >
                                <Text style={[styles.optionText, status === s && styles.optionTextActive]}>{statusLabel(s)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.75 }]} onPress={submit} disabled={saving}>
                        <Ionicons name="send" size={15} color="#fff" />
                        <Text style={styles.submitBtnText}>{saving ? 'Kaydediliyor...' : 'Paylas'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Benim Bloglarim</Text>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="small" color={COLOR} />
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Kayit yok</Text>
                        <Text style={styles.emptySub}>Ilk blogunu yukaridan olusturabilirsin.</Text>
                    </View>
                ) : (
                    posts.map((p) => (
                        <View key={p.id} style={styles.postCard}>
                            <View style={styles.postHeaderRow}>
                                <Text style={styles.postTitle}>{p.title}</Text>
                                <TouchableOpacity style={styles.postDeleteBtn} onPress={() => onDeletePost(p.id)}>
                                    <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.postMeta}>
                                {statusLabel(p.status)} | {visibilityLabel(p.visibility)} | {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => router.push({ pathname: '/(blog)/post-detail', params: { id: p.id } })}
                            >
                                <Text style={styles.postBody} numberOfLines={3}>
                                    {p.cleanContent || p.rawContent}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />

            {/* AI Suggestions Modal */}
            <Modal
                visible={showAiModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAiModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>✨ AI Başlık Önerileri</Text>
                            <TouchableOpacity onPress={() => setShowAiModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSub}>İçeriğine göre en uygun başlıklar burada:</Text>

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
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 20 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    content: { padding: 14, paddingBottom: 24 },
    formCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12 },
    formTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    textarea: { minHeight: 100, textAlignVertical: 'top' },
    fieldLabel: { marginTop: 10, fontSize: 12, fontWeight: '700', color: '#475569' },
    optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
    optionChip: { backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    optionChipActive: { backgroundColor: COLOR },
    optionText: { color: '#334155', fontSize: 12, fontWeight: '700' },
    optionTextActive: { color: '#fff' },
    submitBtn: { marginTop: 12, backgroundColor: COLOR, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    sectionTitle: { marginTop: 14, marginBottom: 8, fontSize: 18, fontWeight: '800', color: '#0F172A' },
    centered: { alignItems: 'center', paddingVertical: 28 },
    emptyCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    postCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 8 },
    postHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    postTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    postDeleteBtn: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    postMeta: { marginTop: 4, fontSize: 11, color: '#64748B' },
    postBody: { marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 18 },

    // Modal Styles
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

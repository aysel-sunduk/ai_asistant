// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { blogService } from '../../services/blog.service';
import type { BlogPost } from '../../src/models/blog.model';
import { useAuthStore } from '../../src/store/auth.store';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#6C63FF';
const VISIBILITY_OPTIONS = ['private', 'followers', 'public'] as const;
const STATUS_OPTIONS = ['draft', 'published', 'archived'] as const;
const PROFANITY_WARNING = 'Argo kelime kullandiniz, paylasim iptal edildi.';

export default function PostDetailScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const id = typeof params.id === 'string' ? params.id : '';
    const user = useAuthStore((s) => s.user);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [post, setPost] = useState<BlogPost | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState<(typeof VISIBILITY_OPTIONS)[number]>('public');
    const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('published');
    const [newComment, setNewComment] = useState('');
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

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

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await blogService.getPost(id);
            setPost(data);
            setTitle(data.title);
            setContent(data.rawContent);
            setTags((data.tags || []).join(', '));
            setVisibility((data.visibility as (typeof VISIBILITY_OPTIONS)[number]) || 'public');
            setStatus((data.status as (typeof STATUS_OPTIONS)[number]) || 'published');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Blog detayi alinamadi.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    const isOwner = useMemo(() => {
        if (!post) return false;
        if (user?.id) return user.id === post.userId;
        return false;
    }, [post, user?.id]);

    const visibilityLabel = (v: string) => (v === 'private' ? 'Ozel' : v === 'followers' ? 'Takipciler' : 'Herkese Acik');
    const statusLabel = (s: string) => (s === 'draft' ? 'Taslak' : s === 'archived' ? 'Arsiv' : 'Yayin');

    const onToggleLike = async () => {
        if (!post) return;
        try {
            const updated = await blogService.toggleLike(post.id);
            setPost(updated);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Begeni islemi basarisiz.');
        }
    };

    const onSave = async () => {
        if (!post) return;
        const normalizedTitle = title.trim();
        const normalizedContent = content.trim();
        if (normalizedTitle.length < 3 || normalizedContent.length < 10) {
            showToast('error', 'Baslik min 3, icerik min 10 karakter olmali.');
            return;
        }
        setSaving(true);
        try {
            const updated = await blogService.updatePost(post.id, {
                title: normalizedTitle,
                rawContent: normalizedContent,
                visibility,
                status,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            });
            setPost(updated);
            setEditMode(false);
            showToast('success', 'Blog guncellendi.');
        } catch (error: any) {
            showToast('error', resolveBlogErrorMessage(error, 'Guncellenemedi.'));
        } finally {
            setSaving(false);
        }
    };

    const onDeletePost = () => {
        if (!post) return;
        Alert.alert('Blogu sil', 'Bu yazi kalici olarak silinsin mi?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await blogService.deletePost(post.id);
                        showToast('success', 'Blog silindi.');
                        router.back();
                    } catch (error: any) {
                        showToast('error', resolveBlogErrorMessage(error, 'Silinemedi.'));
                    }
                },
            },
        ]);
    };

    const onAddComment = async () => {
        if (!post) return;
        const normalized = newComment.trim();
        if (!normalized) return;
        setCommenting(true);
        try {
            const updated = await blogService.addComment(post.id, normalized);
            setPost(updated);
            setNewComment('');
        } catch (error: any) {
            showToast('error', resolveBlogErrorMessage(error, 'Yorum eklenemedi.'));
        } finally {
            setCommenting(false);
        }
    };

    const onDeleteComment = async (commentId: string) => {
        if (!post) return;
        try {
            const updated = await blogService.deleteComment(post.id, commentId);
            setPost(updated);
        } catch (error: any) {
            showToast('error', resolveBlogErrorMessage(error, 'Yorum silinemedi.'));
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLOR} />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyText}>Blog bulunamadi</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>Blog Detay</Text>
                    {isOwner ? (
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={() => setEditMode((p) => !p)} style={styles.headerBtn}>
                                <Ionicons name={editMode ? 'close' : 'create-outline'} size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDeletePost} style={styles.headerBtnDanger}>
                                <Ionicons name="trash-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.headerBtn} />
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, isDark && styles.cardDark]}>
                    {editMode ? (
                        <>
                            <TextInput value={title} onChangeText={setTitle} style={[styles.input, isDark && styles.inputDark]} placeholder="Baslik" />
                            <TextInput value={content} onChangeText={setContent} style={[styles.input, styles.textarea]} multiline placeholder="Icerik" />
                            <TextInput value={tags} onChangeText={setTags} style={[styles.input, isDark && styles.inputDark]} placeholder="Etiketler (virgulle)" />
                            <Text style={styles.fieldLabel}>Gorunurluk</Text>
                            <View style={styles.optionRow}>
                                {VISIBILITY_OPTIONS.map((v) => (
                                    <TouchableOpacity key={v} style={[styles.chip, visibility === v && styles.chipActive]} onPress={() => setVisibility(v)}>
                                        <Text style={[styles.chipText, visibility === v && styles.chipTextActive]}>{visibilityLabel(v)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.fieldLabel}>Durum</Text>
                            <View style={styles.optionRow}>
                                {STATUS_OPTIONS.map((s) => (
                                    <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipActive]} onPress={() => setStatus(s)}>
                                        <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{statusLabel(s)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.75 }]} onPress={onSave} disabled={saving}>
                                    <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={onDeletePost}>
                                    <Text style={styles.deleteBtnText}>Sil</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.title, isDark && styles.textDark]}>{post.title}</Text>
                            <Text style={styles.meta}>
                                {statusLabel(post.status)} | {visibilityLabel(post.visibility)} | {new Date(post.updatedAt).toLocaleString('tr-TR')}
                            </Text>
                            <Text style={styles.body}>{post.cleanContent || post.rawContent}</Text>
                            <View style={styles.reactionRow}>
                                <TouchableOpacity style={styles.reactionBtn} onPress={onToggleLike}>
                                    <Ionicons name={post.likedByMe ? 'heart' : 'heart-outline'} size={18} color={post.likedByMe ? '#EF4444' : '#64748B'} />
                                    <Text style={styles.reactionText}>{post.likeCount || 0}</Text>
                                </TouchableOpacity>
                                <View style={styles.reactionBtn}>
                                    <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                                    <Text style={styles.reactionText}>{post.commentCount ?? post.comments?.length ?? 0}</Text>
                                </View>
                            </View>

                            {(post.likedUsers && post.likedUsers.length > 0) && (
                                <View style={styles.likedUsersRow}>
                                    <Ionicons name="heart" size={12} color="#EF4444" />
                                    <Text style={styles.likedUsersText}>
                                        {post.likedUsers.map((u) => u.displayName).join(', ')}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                <View style={[styles.card, isDark && styles.cardDark]}>
                    <Text style={styles.sectionTitle}>Yorumlar</Text>
                    <View style={styles.commentInputRow}>
                        <TextInput
                            value={newComment}
                            onChangeText={setNewComment}
                            placeholder="Yorum yaz..."
                            style={[styles.input, { flex: 1, marginTop: 0 }]}
                        />
                        <TouchableOpacity style={[styles.commentSendBtn, commenting && { opacity: 0.7 }]} onPress={onAddComment} disabled={commenting}>
                            <Ionicons name="send" size={15} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {(post.comments || []).length === 0 ? (
                        <Text style={styles.emptyComment}>Henuz yorum yok.</Text>
                    ) : (
                        (post.comments || []).map((c) => {
                            const canDelete = c.userId === user?.id || post.userId === user?.id;
                            return (
                                <View key={c.id} style={styles.commentItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.commentMeta}>{c.authorDisplayName || c.authorEmail || 'Kullanici'} | {new Date(c.createdAt).toLocaleString('tr-TR')}</Text>
                                        <Text style={styles.commentText}>{c.content}</Text>
                                    </View>
                                    {canDelete && (
                                        <TouchableOpacity onPress={() => onDeleteComment(c.id)} style={styles.commentDeleteBtn}>
                                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 15, color: '#64748B', fontWeight: '700' },
    header: { backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    headerBtnDanger: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.35)', alignItems: 'center', justifyContent: 'center' },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    content: { padding: 14, paddingBottom: 24 },
    card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 10 },
    title: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    meta: { marginTop: 4, fontSize: 11, color: '#64748B' },
    body: { marginTop: 10, fontSize: 14, color: '#334155', lineHeight: 21 },
    reactionRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
    reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6 },
    reactionText: { fontSize: 12, fontWeight: '700', color: '#334155' },
    input: { marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
    textarea: { minHeight: 110, textAlignVertical: 'top' },
    fieldLabel: { marginTop: 10, fontSize: 12, fontWeight: '700', color: '#475569' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    chipActive: { backgroundColor: COLOR },
    chipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
    chipTextActive: { color: '#fff' },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    saveBtn: { flex: 1, borderRadius: 12, backgroundColor: COLOR, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
    saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    deleteBtn: { width: 88, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
    deleteBtnText: { color: '#B91C1C', fontSize: 13, fontWeight: '800' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    commentSendBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLOR, alignItems: 'center', justifyContent: 'center' },
    emptyComment: { fontSize: 12, color: '#64748B', paddingVertical: 8 },
    commentItem: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, marginTop: 8 },
    commentMeta: { fontSize: 11, color: '#64748B' },
    commentText: { marginTop: 3, fontSize: 13, color: '#334155' },
    commentDeleteBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    likedUsersRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
    likedUsersText: { fontSize: 11, color: '#64748B', flex: 1 },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});

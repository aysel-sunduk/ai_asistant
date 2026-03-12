import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { interviewService } from '../../services/interview.service';
import type { InterviewSession } from '../../src/models/interview.model';
import Toast from '../../components/ui/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';

// Constants to match events.tsx
const COLOR = '#5B8DEF';
const BG = '#F8FAFC'; // slate-50

const STATUS_LABELS: Record<string, string> = {
    SETUP: 'Hazırlık',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
};

// Types for Toast
type ToastType = 'success' | 'error' | 'info';

const formatDateVerbose = (iso?: string) => {
    if (!iso) return 'Tarih Belirsiz';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Tarih Belirsiz';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Same card tone logic as events.tsx
const cardTone = (session: InterviewSession) => {
    switch (session.status) {
        case 'COMPLETED':
            return { bg: '#ECFDF5', border: '#34D399', dot: '#10B981' };
        case 'IN_PROGRESS':
            return { bg: '#EFF6FF', border: '#93C5FD', dot: '#3B82F6' };
        case 'SETUP':
        default:
            return { bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' };
    }
};

export default function MyInterviewsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Modal
    const [addVisible, setAddVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [creatingMode, setCreatingMode] = useState<'save' | 'prepare' | null>(null);

    // Operations
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    // Form
    const [title, setTitle] = useState('');
    const [position, setPosition] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [interviewDate, setInterviewDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Toast
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('info');

    const showToast = (type: ToastType, message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const loadSessions = useCallback(async () => {
        try {
            const data = await interviewService.listMySessions();
            let filtered = data;

            // Apply search filter locally since we fetch all sessions
            const q = debouncedQuery.trim().toLowerCase();
            if (q.length >= 2) {
                filtered = filtered.filter(s =>
                    s.title.toLowerCase().includes(q) ||
                    s.position.toLowerCase().includes(q)
                );
            }

            setSessions(filtered);
        } catch (error: any) {
            console.error('Mülakatlar yüklenemedi:', error);
            showToast('error', error?.response?.data?.message || 'Mülakatlar alınamadı.');
        }
    }, [debouncedQuery]);

    const reload = useCallback(async (pull = false) => {
        if (pull) setRefreshing(true);
        else setLoading(true);
        try {
            await loadSessions();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loadSessions]);

    useFocusEffect(
        useCallback(() => {
            void reload();
        }, [reload]),
    );

    useEffect(() => {
        if (!loading) {
            void loadSessions();
        }
    }, [loadSessions, loading]);

    const resetForm = () => {
        setTitle('');
        setPosition('');
        setJobDescription('');
        setInterviewDate(null);
    };

    const handleCreate = async (mode: 'save' | 'prepare' = 'save') => {
        if (!title.trim() || !position.trim()) {
            Alert.alert('Eksik Bilgi', 'Başlık ve pozisyon gereklidir.');
            return;
        }
        try {
            setCreatingMode(mode);
            setCreating(true);
            const session = await interviewService.createSession({
                title: title.trim(),
                position: position.trim(),
                jobDescription: jobDescription.trim() || undefined,
                interviewDate: interviewDate ? interviewDate.toISOString() : undefined,
            });

            if (mode === 'prepare') {
                await interviewService.generateQuestions(session.id);
                resetForm();
                setAddVisible(false);
                showToast('success', 'Mülakat hazırlandı!');
                await reload();
                router.push({
                    pathname: '/(work)/interview-session',
                    params: { sessionId: session.id },
                });
                return;
            }

            resetForm();
            setAddVisible(false);
            showToast('success', 'Mülakat kaydedildi!');
            await reload();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || (mode === 'prepare' ? 'Mülakat hazırlanamadı.' : 'Mülakat oluşturulamadı.'));
        } finally {
            setCreating(false);
            setCreatingMode(null);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Mülakatı Sil', 'Bu mülakat kalıcı olarak silinsin mi?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await interviewService.deleteSession(id);
                        showToast('success', 'Mülakat silindi.');
                        await reload();
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Mülakat silinemedi.');
                    }
                },
            },
        ]);
    };

    const handlePrepareInterview = async (session: InterviewSession) => {
        // Sorular hazirsa direkt pratik ekranina git
        if (session.questions && session.questions.length > 0) {
            router.push({
                pathname: '/(work)/interview-session',
                params: { sessionId: session.id },
            });
            return;
        }

        // Soru yoksa AI ile hazirla
        try {
            setGeneratingId(session.id);
            await interviewService.generateQuestions(session.id);
            showToast('success', 'Mülakat pratiği hazırlandı!');
            router.push({
                pathname: '/(work)/interview-session',
                params: { sessionId: session.id },
            });
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Mülakat hazırlığı tamamlanamadı. Lütfen tekrar deneyin.');
        } finally {
            setGeneratingId(null);
        }
    };

    const counts = useMemo(() => {
        return {
            total: sessions.length,
            setup: sessions.filter(s => s.status === 'SETUP').length,
            completed: sessions.filter(s => s.status === 'COMPLETED').length,
        };
    }, [sessions]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>İş</Text>
                    <TouchableOpacity onPress={() => setAddVisible(true)} style={styles.iconBtn}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* TABS */}
                <View style={styles.tabRow}>
                    <TouchableOpacity style={styles.tab} onPress={() => router.replace('/(work)/events')}>
                        <Text style={styles.tabTxt}>Toplantılarım</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                        <Text style={[styles.tabTxt, styles.activeTabTxt]}>Mülakatlarım</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <StatItem value={counts.total} label="Toplam" />
                    <StatItem value={counts.setup} label="Hazırlanılan" />
                    <StatItem value={counts.completed} label="Tamamlanan" />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} />}
            >
                <View style={styles.searchRow}>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Mülakat ara (min. 2 karakter)"
                        style={styles.searchInput}
                    />
                </View>

                <Text style={styles.sectionTitle}>Mülakatlar</Text>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                    </View>
                ) : sessions.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Mülakat bulunamadı</Text>
                        <Text style={styles.emptySub}>Yeni mülakat ekleyebilirsiniz.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {sessions.map((s) => {
                            const tone = cardTone(s);
                            const hasQuestions = s.questions && s.questions.length > 0;
                            const isGenerating = generatingId === s.id;

                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}
                                    activeOpacity={0.88}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/(work)/interview-detail',
                                            params: { sessionId: s.id },
                                        })
                                    }
                                >
                                    <View style={[styles.cardDot, { backgroundColor: tone.dot }]} />
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardTitle}>{s.title}</Text>
                                        <Text style={styles.cardTime}>{formatDateVerbose(s.interviewDate)}</Text>
                                        <View style={styles.metaRow}>
                                            <MiniTag text={s.position} />
                                            <MiniTag text={STATUS_LABELS[s.status] || s.status} />
                                            {s.overallScore != null && s.overallScore > 0 && (
                                                <MiniTag text={`Skor: ${s.overallScore}`} color="#F59E0B" />
                                            )}
                                        </View>
                                        {hasQuestions ? (
                                            <Text style={styles.cardLocation}>{s.questions.length} Soru Hazır</Text>
                                        ) : (
                                            <Text style={[styles.cardLocation, { color: '#F59E0B' }]}>Soru Yok</Text>
                                        )}

                                        <TouchableOpacity
                                            style={[styles.primaryBtn, isGenerating && { opacity: 0.7 }]}
                                            onPress={() => handlePrepareInterview(s)}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="logo-electron" size={16} color="#fff" />
                                                    <Text style={styles.primaryBtnText}>Mülakata Hazırlan</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(s.id)}>
                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* ADD MODAL */}
            <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setAddVisible(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <Pressable style={styles.modalSheet} onPress={() => undefined}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitleText}>Yeni Mülakat Ekle</Text>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <Text style={styles.label}>Başlık *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Örn: Google Frontend Developer"
                                    placeholderTextColor="#94A3B8"
                                    value={title}
                                    onChangeText={setTitle}
                                />

                                <Text style={styles.label}>Pozisyon *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Örn: Senior React Native Developer"
                                    placeholderTextColor="#94A3B8"
                                    value={position}
                                    onChangeText={setPosition}
                                />

                                <Text style={styles.label}>Mülakat Tarihi</Text>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                    <Ionicons name="calendar-outline" size={18} color="#64748B" />
                                    <Text style={styles.dateBtnText}>
                                        {interviewDate
                                            ? interviewDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                                            : 'Tarih seç (opsiyonel)'}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={interviewDate || new Date()}
                                        mode="date"
                                        display="spinner"
                                        onChange={(_, date) => {
                                            setShowDatePicker(Platform.OS === 'ios');
                                            if (date) setInterviewDate(date);
                                        }}
                                    />
                                )}

                                <Text style={styles.label}>İş Tanımı (opsiyonel)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="İlan detaylarını buraya ekle..."
                                    placeholderTextColor="#94A3B8"
                                    value={jobDescription}
                                    onChangeText={setJobDescription}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    style={[styles.aiPrepareBtn, creating && { opacity: 0.7 }]}
                                    onPress={() => handleCreate('prepare')}
                                    disabled={creating}
                                >
                                    {creating && creatingMode === 'prepare' ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="sparkles" size={16} color="#fff" />
                                            <Text style={styles.aiPrepareBtnText}>Mülakat Hazırla</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setAddVisible(false); }}>
                                    <Text style={styles.cancelBtnText}>Vazgeç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.createBtn, creating && { opacity: 0.6 }]}
                                    onPress={handleCreate}
                                    disabled={creating}
                                >
                                    {creating && creatingMode === 'save' ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.createBtnText}>Kaydet</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

function StatItem({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statVal}>{value}</Text>
            <Text style={styles.statLbl}>{label}</Text>
        </View>
    );
}

function MiniTag({ text, color = '#64748B' }: { text: string; color?: string }) {
    return (
        <View style={styles.miniTag}>
            <Text style={[styles.miniTagTxt, { color }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        paddingBottom: 14,
    },
    headerTop: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
    tabRow: {
        flexDirection: 'row',
        marginTop: 18,
        marginBottom: 8,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#fff',
    },
    tabTxt: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabTxt: {
        color: '#fff',
        fontWeight: '800',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 30, fontWeight: '800', color: '#fff' },
    statLbl: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: 4 },

    content: { padding: 14, paddingBottom: 28 },
    searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 14,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginTop: 6, marginBottom: 10 },

    list: { gap: 10 },
    card: {
        flexDirection: 'row',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
    },
    cardDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    cardTime: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 12 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    miniTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    miniTagTxt: { fontSize: 11, fontWeight: '700' },
    cardLocation: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 16 },
    cardActions: { justifyContent: 'space-between', alignItems: 'flex-end' },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 8,
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLOR,
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6
    },
    primaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    centered: { paddingVertical: 40, alignItems: 'center' },
    emptyBox: { alignItems: 'center', backgroundColor: '#fff', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center' },

    // Modal
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 32 : 24,
        maxHeight: '88%',
    },
    modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: '#CBD5E1', marginBottom: 16 },
    modalTitleText: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 14, marginLeft: 4 },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    textArea: { height: 90, textAlignVertical: 'top', paddingTop: 14 },
    dateBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    dateBtnText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    aiPrepareBtn: {
        marginTop: 16,
        backgroundColor: COLOR,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    aiPrepareBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    cancelBtn: {
        flex: 1, paddingVertical: 16, borderRadius: 16,
        backgroundColor: '#F1F5F9', alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
    createBtn: {
        flex: 2, paddingVertical: 16, borderRadius: 16,
        backgroundColor: COLOR, alignItems: 'center', justifyContent: 'center',
    },
    createBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

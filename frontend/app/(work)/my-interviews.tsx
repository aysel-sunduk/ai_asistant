import React, { useCallback, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { interviewService } from '../../services/interview.service';
import type { InterviewSession } from '../../src/models/interview.model';
import Toast from '../../components/ui/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY = '#4F46E5';
const ACCENT = '#6366F1';
const BG = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const SUCCESS = '#10B981';

const STATUS_LABELS: Record<string, string> = {
    SETUP: 'Hazırlık',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
};
const STATUS_COLORS: Record<string, string> = {
    SETUP: '#F59E0B',
    IN_PROGRESS: PRIMARY,
    COMPLETED: SUCCESS,
};

const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function MyInterviewsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);

    // Add modal
    const [addVisible, setAddVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [position, setPosition] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [interviewDate, setInterviewDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Toast
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const loadSessions = useCallback(async () => {
        try {
            const data = await interviewService.listMySessions();
            setSessions(data);
        } catch (error) {
            console.error('Mülakatlar yüklenemedi:', error);
            showToast('error', 'Mülakatlar yüklenemedi.');
        }
    }, []);

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

    const resetForm = () => {
        setTitle('');
        setPosition('');
        setJobDescription('');
        setInterviewDate(null);
    };

    const handleCreate = async () => {
        if (!title.trim() || !position.trim()) {
            Alert.alert('Eksik Bilgi', 'Başlık ve pozisyon gereklidir.');
            return;
        }
        try {
            setCreating(true);
            await interviewService.createSession({
                title: title.trim(),
                position: position.trim(),
                jobDescription: jobDescription.trim() || undefined,
                interviewDate: interviewDate ? interviewDate.toISOString() : undefined,
            });
            resetForm();
            setAddVisible(false);
            showToast('success', 'Mülakat oluşturuldu!');
            await loadSessions();
        } catch (error) {
            console.error(error);
            showToast('error', 'Mülakat oluşturulamadı.');
        } finally {
            setCreating(false);
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
                        await loadSessions();
                    } catch (error) {
                        showToast('error', 'Mülakat silinemedi.');
                    }
                },
            },
        ]);
    };

    const handleGenerateQuestions = (session: InterviewSession) => {
        router.push({
            pathname: '/(work)/interview-session',
            params: { sessionId: session.id },
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mülakatlarım</Text>
                <TouchableOpacity onPress={() => setAddVisible(true)} style={styles.addBtn}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* STATS */}
            <View style={styles.statsRow}>
                <StatBadge value={sessions.length} label="Toplam" color={PRIMARY} />
                <StatBadge value={sessions.filter(s => s.status === 'SETUP').length} label="Hazırlık" color="#F59E0B" />
                <StatBadge value={sessions.filter(s => s.status === 'COMPLETED').length} label="Tamamlanan" color={SUCCESS} />
            </View>

            {/* LIST */}
            <ScrollView
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reload(true)} />}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={PRIMARY} />
                    </View>
                ) : sessions.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>Henüz mülakat eklenmedi</Text>
                        <Text style={styles.emptySub}>Sağ üstteki + butonuyla yeni mülakat ekle.</Text>
                    </View>
                ) : (
                    sessions.map((s) => (
                        <View key={s.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[s.status] || '#94A3B8' }]} />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
                                    <Text style={styles.cardPosition}>{s.position}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(s.id)} hitSlop={12}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                                    <Text style={styles.metaText}>{formatDate(s.interviewDate)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[s.status] || '#94A3B8') + '18' }]}>
                                    <Text style={[styles.statusText, { color: STATUS_COLORS[s.status] || '#94A3B8' }]}>
                                        {STATUS_LABELS[s.status] || s.status}
                                    </Text>
                                </View>
                            </View>

                            {s.questions.length > 0 && (
                                <Text style={styles.questionCount}>
                                    {s.questions.length} soru hazır
                                </Text>
                            )}

                            <TouchableOpacity
                                style={styles.generateBtn}
                                onPress={() => handleGenerateQuestions(s)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="sparkles" size={18} color="#fff" />
                                <Text style={styles.generateBtnText}>
                                    {s.questions.length > 0 ? 'Mülakata Git' : 'Soru Oluştur'}
                                </Text>
                            </TouchableOpacity>

                            {s.overallScore != null && s.overallScore > 0 && (
                                <View style={styles.scoreRow}>
                                    <Ionicons name="trophy" size={16} color="#F59E0B" />
                                    <Text style={styles.scoreText}>Skor: {s.overallScore}/100</Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>

            {/* ADD MODAL */}
            <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setAddVisible(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <Pressable style={styles.modalSheet} onPress={() => undefined}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitle}>Yeni Mülakat Ekle</Text>

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
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setAddVisible(false); }}>
                                    <Text style={styles.cancelBtnText}>Vazgeç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.createBtn, creating && styles.disabledBtn]}
                                    onPress={handleCreate}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="add-circle" size={18} color="#fff" />
                                            <Text style={styles.createBtnText}>Oluştur</Text>
                                        </>
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

function StatBadge({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <View style={[styles.statBadge, { backgroundColor: color + '14' }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: color + 'CC' }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: PRIMARY,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    addBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
    },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginTop: -14,
        marginBottom: 8,
    },
    statBadge: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    statValue: { fontSize: 24, fontWeight: '900' },
    statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },

    listContent: { paddingHorizontal: 20, paddingTop: 16 },
    centered: { paddingVertical: 60, alignItems: 'center' },
    emptyBox: {
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center' },

    card: {
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: PRIMARY,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    cardPosition: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 2 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    statusText: { fontSize: 11, fontWeight: '800' },
    questionCount: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 10 },
    generateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 14, gap: 8,
        marginTop: 14,
        shadowColor: ACCENT, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    scoreText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

    // Modal
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 32 : 24,
        maxHeight: '88%',
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 14,
    },
    modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: '#CBD5E1', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
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
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: {
        flex: 1, paddingVertical: 16, borderRadius: 16,
        backgroundColor: '#F1F5F9', alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
    createBtn: {
        flex: 2, paddingVertical: 16, borderRadius: 16,
        backgroundColor: PRIMARY, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    createBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    disabledBtn: { opacity: 0.6 },
});

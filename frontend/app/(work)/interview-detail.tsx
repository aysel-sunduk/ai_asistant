import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { interviewService } from '../../services/interview.service';
import type { InterviewSession, InterviewQuestionDTO } from '../../src/models/interview.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#5B8DEF';
const BG = '#F8FAFC';

const STATUS_LABELS: Record<string, string> = {
    SETUP: 'Hazırlık',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
};

const formatDateVerbose = (iso?: string) => {
    if (!iso) return 'Tarih Belirsiz';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Tarih Belirsiz';
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function InterviewDetailScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestionDTO | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const loadSession = useCallback(async (pull = false) => {
        if (!sessionId) return;
        if (pull) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await interviewService.getSession(sessionId);
            setSession(data);
        } catch {
            Alert.alert('Hata', 'Mülakat detayı yüklenemedi.');
            router.back();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [router, sessionId]);

    useEffect(() => {
        void loadSession();
    }, [loadSession]);

    const handlePrepare = async () => {
        if (!sessionId || !session) return;
        try {
            setPreparing(true);
            if (!session.questions || session.questions.length === 0) {
                const updated = await interviewService.generateQuestions(sessionId);
                setSession(updated);
            }
            router.push({
                pathname: '/(work)/interview-session',
                params: { sessionId },
            });
        } catch {
            Alert.alert('Hata', 'Bu mülakat için soru hazırlığı yapılamadı.');
        } finally {
            setPreparing(false);
        }
    };

    const handleReanalyze = async () => {
        if (!sessionId) return;
        try {
            setAnalyzing(true);
            const updated = await interviewService.analyzeInterview(sessionId);
            setSession(updated);
            Alert.alert('Başarılı', 'Analiz raporu güncellendi.');
        } catch (error: any) {
            console.error('Re-analyze error:', error);
            Alert.alert('Hata', 'Analiz güncellenemedi: ' + (error.response?.data?.message || error.message));
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLOR} />
            </View>
        );
    }

    if (!session) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>Mülakat detayı bulunamadı.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>Mülakat Detayı</Text>
                    <View style={styles.iconBtnGhost} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSession(true)} />}
            >
                <View style={[styles.card, isDark && styles.cardDark]}>
                    <Text style={[styles.title, isDark && styles.textDark]}>{session.title}</Text>
                    <Text style={styles.position}>{session.position}</Text>

                    <View style={styles.metaRow}>
                        <Meta label="Tarih" value={formatDateVerbose(session.interviewDate)} />
                        <Meta label="Durum" value={STATUS_LABELS[session.status] || session.status} />
                        <Meta label="Soru" value={`${session.questions?.length || 0}`} />
                    </View>

                    {session.status === 'COMPLETED' && session.overallScore != null && (
                        <View style={styles.scoreCard}>
                            <Text style={styles.scoreLabel}>Genel Başarı Skoru</Text>
                            <Text style={styles.scoreValue}>{session.overallScore}/100</Text>
                            <TouchableOpacity 
                                style={styles.reanalyzeBtn} 
                                onPress={handleReanalyze}
                                disabled={analyzing}
                            >
                                {analyzing ? (
                                    <ActivityIndicator size="small" color={COLOR} />
                                ) : (
                                    <>
                                        <Ionicons name="refresh-outline" size={14} color={COLOR} />
                                        <Text style={styles.reanalyzeBtnText}>Analizi Güncelle</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text-outline" size={18} color={COLOR} />
                        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>
                            {session.status === 'COMPLETED' ? 'Genel Özet' : 'İş Tanımı'}
                        </Text>
                    </View>
                    <Text style={[styles.description, isDark && styles.textDark]}>
                        {session.status === 'COMPLETED' 
                            ? (session.overallFeedback || 'Değerlendirme hazırlanıyor...')
                            : (session.jobDescription?.trim() || 'Bu mülakat için henüz iş tanımı eklenmemiş.')}
                    </Text>
                </View>

                {session.status === 'COMPLETED' && session.questions && session.questions.length > 0 && (
                    <View style={styles.questionSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="list" size={20} color={COLOR} />
                            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Soru Bazlı Analiz</Text>
                        </View>
                        <Text style={styles.helperText}>Detaylar için karta dokunun</Text>
                        
                        {session.questions.map((q, idx) => (
                            <QuestionCard 
                                key={q.id || idx} 
                                question={q} 
                                index={idx + 1} 
                                isDark={isDark}
                                onPress={() => {
                                    setSelectedQuestion(q);
                                    setModalVisible(true);
                                }}
                            />
                        ))}
                    </View>
                )}

                {session.status !== 'COMPLETED' && (
                    <TouchableOpacity
                        style={[styles.prepareBtn, preparing && { opacity: 0.7 }]}
                        onPress={handlePrepare}
                        disabled={preparing}
                    >
                        {preparing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="logo-electron" size={18} color="#fff" />
                                <Text style={styles.prepareBtnText}>Mülakata Hazırlan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>

            <QuestionDetailModal 
                visible={modalVisible}
                question={selectedQuestion}
                onClose={() => setModalVisible(false)}
                isDark={isDark}
            />
        </View>
    );
}

function QuestionCard({ question, index, isDark, onPress }: { 
    question: InterviewQuestionDTO, 
    index: number, 
    isDark: boolean,
    onPress: () => void 
}) {
    const diff = question.difficulty?.toUpperCase() || 'MEDIUM';
    const colors = {
        EASY: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', badge: '#22C55E' },
        MEDIUM: { bg: '#FFFBEB', border: '#FEF3C7', text: '#92400E', badge: '#F59E0B' },
        HARD: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', badge: '#EF4444' },
    }[diff as 'EASY' | 'MEDIUM' | 'HARD'] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', badge: '#64748B' };

    return (
        <TouchableOpacity 
            style={[
                styles.questionCard, 
                { backgroundColor: colors.bg, borderColor: colors.border },
                isDark && { backgroundColor: '#111827', borderColor: '#374151' }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.questionCardHeader}>
                <Text style={[styles.questionNumber, { color: colors.text }]}>{index}. Soru</Text>
                <View style={[styles.scoreBadge, { backgroundColor: colors.badge }]}>
                    <Text style={styles.scoreBadgeText}>{question.score || 0}</Text>
                </View>
            </View>
            <Text style={[styles.questionText, isDark && styles.textDark]} numberOfLines={3}>
                {question.questionText}
            </Text>
            <View style={styles.cardFooter}>
                <Text style={styles.tapToSee}>Detaylar ve Geri Bildirim için Dokunun</Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );
}

function QuestionDetailModal({ visible, question, onClose, isDark }: { 
    visible: boolean, 
    question: InterviewQuestionDTO | null, 
    onClose: () => void,
    isDark: boolean
}) {
    if (!question) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <View style={[styles.modalContent, isDark && styles.cardDark]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>Soru Detayı</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                        <View style={styles.modalSection}>
                            <Text style={styles.modalLabel}>Soru</Text>
                            <Text style={[styles.modalValue, isDark && styles.textDark]}>{question.questionText}</Text>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalLabel}>Cevabınız</Text>
                            <View style={[styles.answerBox, isDark && { backgroundColor: '#1E293B' }]}>
                                <Text style={[styles.answerText, isDark && styles.textDark]}>
                                    {question.answerText || 'Cevap verilmedi'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <View style={styles.feedbackHeader}>
                                <Text style={styles.modalLabel}>Yapay Zeka Analizi</Text>
                                <View style={styles.modalScoreBox}>
                                    <Text style={styles.modalScoreText}>{question.score || 0}/100</Text>
                                </View>
                            </View>
                            <View style={[styles.feedbackCard, isDark && { backgroundColor: '#1E293B' }]}>
                                <Text style={[styles.feedbackText, isDark && styles.textDark]}>
                                    {question.feedback || 'Bu soru için henüz detaylı geri bildirim hazır değil.'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, color: '#64748B' },
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
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnGhost: { width: 40, height: 40 },
    content: { padding: 14, paddingBottom: 28, gap: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
    },
    title: { fontSize: 23, fontWeight: '800', color: '#0F172A' },
    position: { marginTop: 4, fontSize: 15, fontWeight: '700', color: '#64748B' },
    metaRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
    metaBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    metaLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    metaValue: { marginTop: 3, fontSize: 13, fontWeight: '800', color: '#1E293B' },
    sectionTitle: { marginTop: 16, fontSize: 14, fontWeight: '800', color: '#1E293B' },
    description: { marginTop: 6, fontSize: 14, color: '#334155', lineHeight: 21 },
    prepareBtn: {
        backgroundColor: COLOR,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    prepareBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    /* ─── Results Styles ─── */
    scoreCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 20,
        marginVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    scoreLabel: { fontSize: 13, fontWeight: '700', color: '#0369A1', marginBottom: 4 },
    scoreValue: { fontSize: 32, fontWeight: '900', color: '#0284C7' },
    reanalyzeBtn: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    reanalyzeBtnText: { fontSize: 12, fontWeight: '700', color: COLOR },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
    feedbackCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    feedbackText: { fontSize: 14, color: '#334155', lineHeight: 22 },

    /* ─── Question List Styles ─── */
    questionSection: { marginTop: 12, paddingHorizontal: 14, gap: 10 },
    helperText: { fontSize: 12, color: '#94A3B8', marginBottom: 4, marginLeft: 2 },
    questionCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    questionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    questionNumber: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        minWidth: 36,
        alignItems: 'center',
    },
    scoreBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
    questionText: { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 22 },
    cardFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8 },
    tapToSee: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

    /* ─── Modal Styles ─── */
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, width: '100%', maxHeight: '80%', padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    closeBtn: { padding: 4 },
    modalScroll: { gap: 20 },
    modalSection: { gap: 8 },
    modalLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
    modalValue: { fontSize: 16, fontWeight: '700', color: '#1E293B', lineHeight: 24 },
    answerBox: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    answerText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    feedbackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalScoreBox: { backgroundColor: '#F0F9FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' },
    modalScoreText: { fontSize: 13, fontWeight: '800', color: '#0284C7' },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});

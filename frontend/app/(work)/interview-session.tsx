import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { interviewService } from '../../services/interview.service';
import { sttService } from '../../services/stt.service';
import type { InterviewSession } from '../../src/models/interview.model';
import { Alert as RNAlert } from 'react-native';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PRIMARY = '#4F46E5'; // Indigo
const SECONDARY = '#EEF2FF';
const ACCENT = '#6366F1';
const SUCCESS = '#10B981';
const BACKGROUND = '#FBFCFE';
const CARD_BG = '#FFFFFF';

export default function InterviewSessionScreen() {
    const sysMode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(sysMode, systemScheme) === 'dark';

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answerText, setAnswerText] = useState('');
    const [mode, setMode] = useState<'SETUP' | 'ANSWERING' | 'COMPLETED'>('SETUP');
    const [isListening, setIsListening] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    const loadSession = async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            const data = await interviewService.getSession(sessionId);
            setSession(data);
            if (data.status === 'IN_PROGRESS') setMode('ANSWERING');
            else if (data.status === 'COMPLETED') setMode('COMPLETED');
            else setMode('SETUP');
        } catch (error) {
            console.error('Session load error:', error);
            Alert.alert('Hata', 'Mülakat verileri yüklenemedi.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!sessionId) return;
        try {
            setSubmitting(true);
            await interviewService.startInterview(sessionId);
            setMode('ANSWERING');
        } catch (error) {
            Alert.alert('Hata', 'Mülakat başlatılamadı.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrepareWithAI = async () => {
        if (!sessionId) return;
        try {
            setSubmitting(true);
            const updated = await interviewService.generateQuestions(sessionId);
            const prepared = updated ?? await interviewService.getSession(sessionId);
            setSession(prepared);
            await interviewService.startInterview(sessionId);
            setCurrentIndex(0);
            setAnswerText('');
            setMode('ANSWERING');
        } catch {
            Alert.alert('Hata', 'AI mülakat hazırlığı sırasında bir sorun oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRegenerateQuestions = async () => {
        if (!sessionId) return;
        try {
            setSubmitting(true);
            const updated = await interviewService.generateQuestions(sessionId as string);
            setSession(updated);
        } catch (error: any) {
            Alert.alert('Hata', error?.response?.data?.message || 'Sorular yenilenemedi. Lütfen tekrar deneyin.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!session || !answerText.trim()) return;
        const currentQuestion = session.questions[currentIndex];
        
        let submitSuccess = false;
        try {
            setSubmitting(true);
            // Yerel state'i güncelle
            const updatedQuestions = [...session.questions];
            updatedQuestions[currentIndex].answerText = answerText.trim();
            setSession({ ...session, questions: updatedQuestions });

            await interviewService.submitAnswer({
                questionId: currentQuestion.id,
                answerText: answerText.trim()
            });
            submitSuccess = true;
        } catch (error) {
            console.error('Submit answer error:', error);
            Alert.alert('Hata', 'Cevabınız iletilemedi. Lütfen internetinizi kontrol edip tekrar deneyin.');
            setSubmitting(false);
        }

        if (submitSuccess) {
            if (currentIndex < session.questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setAnswerText('');
                setSubmitting(false);
            } else {
                // Son soru ise bitirme ve analiz aşamasına geç
                await handleFinish();
            }
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0 && session) {
            // Mevcut cevabı yerel state'e kaydet (opsiyonel ama iyi olur)
            const updatedQuestions = [...session.questions];
            updatedQuestions[currentIndex].answerText = answerText;
            setSession({ ...session, questions: updatedQuestions });

            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            setAnswerText(session.questions[prevIndex].answerText || '');
        }
    };

    const handleFinish = async () => {
        if (!sessionId || !session) return;
        setSubmitting(true);
        try {
            const updatedSession = await interviewService.analyzeInterview(session.id);
            router.push({
                pathname: '/(work)/interview-detail',
                params: { sessionId: updatedSession.id }
            });
        } catch (error: any) {
            console.error('Analysis error details:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen bir hata oluştu.';
            Alert.alert('Hata', `Analiz yapılamadı: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleListening = async () => {
        try {
            if (isListening) {
                // Kaydı durdur ve işle
                setIsListening(false);
                if (recording) {
                    await recording.stopAndUnloadAsync();
                    const uri = recording.getURI();
                    if (uri) {
                        setSubmitting(true);
                        try {
                            const text = await sttService.transcribe(uri);
                            if (text) {
                                setAnswerText(prev => prev ? `${prev} ${text}` : text);
                            }
                        } catch (err) {
                            Alert.alert('STT Hatası', 'Ses metne dönüştürülemedi.');
                        } finally {
                            setSubmitting(false);
                        }
                    }
                    setRecording(null);
                }
            } else {
                // Kaydı başlat
                const { status } = await Audio.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('İzin Gerekli', 'Mikrofon izni verilmedi.');
                    return;
                }

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording: newRecording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(newRecording);
                setIsListening(true);
            }
        } catch (error) {
            console.error('Mic error:', error);
            Alert.alert('Hata', 'Mikrofon kullanılırken bir sorun oluştu.');
            setIsListening(false);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!session) return;
        Alert.alert(
            'Soruyu Sil',
            'Bu soruyu silmek istediğine emin misin?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await interviewService.deleteQuestion(questionId);
                            await loadSession();
                        } catch (error) {
                            Alert.alert('Hata', 'Soru silinemedi.');
                        }
                    },
                },
            ],
        );
    };

    const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
        if (!session || !sessionId) return;
        const qs = [...session.questions];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= qs.length) return;

        const orders = qs.map((q, i) => {
            let newOrder = q.orderNo;
            if (i === index) newOrder = qs[swapIdx].orderNo;
            if (i === swapIdx) newOrder = qs[index].orderNo;
            return { id: q.id, orderNo: newOrder };
        });

        try {
            await interviewService.reorderQuestions(sessionId, { orders });
            await loadSession();
        } catch (error) {
            Alert.alert('Hata', 'Sıralama güncellenemedi.');
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loadingText}>Mülakat verileri yükleniyor...</Text>
            </View>
        );
    }

    const questions = session?.questions || [];
    const currentQuestion = questions[currentIndex];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && styles.textDark]} numberOfLines={1}>{session?.title}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{mode}</Text>
                </View>
            </View>

            {mode === 'SETUP' && (
                <View style={styles.viewContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={[styles.title, { marginBottom: 0 }]}>İşte Hazırladığım Sorular</Text>
                        {questions.length > 0 && (
                            <TouchableOpacity onPress={handleRegenerateQuestions} disabled={submitting} style={{ padding: 4 }}>
                                <Ionicons name="refresh-circle" size={32} color={PRIMARY} style={{ opacity: submitting ? 0.5 : 1 }} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={[styles.subtitle, isDark && styles.subTextDark]}>
                        {questions.length > 0
                            ? 'Seni terletecek ama geliştirecek profesyonel sorular seni bekliyor.'
                            : 'Mülakat detayını görüntülüyorsun. Hazır olduğunda AI ile soruları hazırlatıp direkt başlayabilirsin.'}
                    </Text>

                    <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                        {questions.length === 0 ? (
                            <View style={styles.emptyQuestionsBox}>
                                <Ionicons name="information-circle-outline" size={24} color="#64748B" />
                                <Text style={styles.emptyQuestionsText}>Henüz hazırlanmış soru yok.</Text>
                            </View>
                        ) : (
                            questions.map((q, i) => (
                                <View key={q.id} style={styles.questionItem}>
                                    <View style={styles.questionNumCircle}>
                                        <Text style={styles.questionNum}>{i + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.questionTxt}>{q.questionText}</Text>
                                        {q.difficulty && (
                                            <View style={[styles.diffBadge, (styles as any)[`diff${q.difficulty}`]]}>
                                                <Text style={styles.diffText}>
                                                    {q.difficulty === 'HARD' ? 'ZOR' : q.difficulty === 'MEDIUM' ? 'ORTA' : 'KOLAY'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.questionActions}>
                                        <TouchableOpacity
                                            onPress={() => handleMoveQuestion(i, 'up')}
                                            disabled={i === 0}
                                            style={[styles.qActionBtn, i === 0 && { opacity: 0.3 }]}
                                        >
                                            <Ionicons name="chevron-up" size={18} color={PRIMARY} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleMoveQuestion(i, 'down')}
                                            disabled={i === questions.length - 1}
                                            style={[styles.qActionBtn, i === questions.length - 1 && { opacity: 0.3 }]}
                                        >
                                            <Ionicons name="chevron-down" size={18} color={PRIMARY} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteQuestion(q.id)}
                                            style={styles.qActionBtn}
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={questions.length > 0 ? handleStart : handlePrepareWithAI}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.primaryBtnText}>
                                    {questions.length > 0 ? 'Mülakatı Başlat' : 'Mülakata Hazırlan'}
                                </Text>
                                <Ionicons name={questions.length > 0 ? 'play-circle' : 'logo-electron'} size={24} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {mode === 'ANSWERING' && currentQuestion && (
                <ScrollView 
                    style={{ flex: 1 }} 
                    contentContainerStyle={styles.answeringContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.progressContainer}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressLabel}>Soru {currentIndex + 1} / {questions.length}</Text>
                            <Text style={styles.progressPercent}>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.questionCard}>
                        <Ionicons name="chatbubble-ellipses" size={32} color="#fff" style={styles.cardIcon} />
                        {currentQuestion.difficulty && (
                            <View style={[styles.activeDiffBadge, (styles as any)[`diff${currentQuestion.difficulty}`]]}>
                                <Text style={styles.activeDiffText}>
                                    {currentQuestion.difficulty === 'HARD' ? 'ZOR' : currentQuestion.difficulty === 'MEDIUM' ? 'ORTA' : 'KOLAY'}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.activeQuestion}>{currentQuestion.questionText}</Text>
                    </View>

                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.answerInput}
                            placeholder="Cevabınızı buraya detaylıca yazın..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            autoFocus
                            value={answerText}
                            onChangeText={setAnswerText}
                        />
                    </View>

                    <View style={styles.actionRow}>
                        {currentIndex > 0 && (
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={handlePrevious}
                                disabled={submitting}
                            >
                                <Ionicons name="chevron-back" size={24} color={PRIMARY} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.micBtn, isListening && styles.micBtnActive]}
                            onPress={toggleListening}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isListening ? "stop" : "mic"}
                                size={26}
                                color="#fff"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.nextBtn, !answerText.trim() && styles.disabledBtn]}
                            onPress={handleSubmitAnswer}
                            disabled={submitting || !answerText.trim()}
                        >
                            {submitting ? <ActivityIndicator color="#fff" /> : (
                                <>
                                    <Text style={styles.nextBtnText}>
                                        {currentIndex === questions.length - 1 ? 'Mülakatı Kapat' : 'Sonraki Soru'}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {mode === 'COMPLETED' && (
                <ScrollView contentContainerStyle={styles.completedContent}>
                    <View style={styles.scoreContainer}>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreVal}>{session?.overallScore || 0}</Text>
                            <Text style={styles.scoreMax}>/ 100</Text>
                        </View>
                        <Text style={styles.scoreLabel}>Başarı Skoru</Text>
                    </View>

                    <View style={styles.feedbackSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="analytics" size={24} color={PRIMARY} />
                            <Text style={styles.sectionTitle}>Performans Analizi</Text>
                        </View>
                        <View style={styles.feedbackCard}>
                            <Text style={styles.feedbackText}>{session?.overallFeedback}</Text>
                        </View>
                    </View>

                    <View style={styles.feedbackSection}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="list" size={24} color={PRIMARY} />
                            <Text style={styles.sectionTitle}>Soru Bazlı Detaylar</Text>
                        </View>
                        {questions.map((q, i) => {
                            const diff = q.difficulty?.toUpperCase() || 'MEDIUM';
                            const colors = {
                                EASY: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', badge: '#22C55E' },
                                MEDIUM: { bg: '#FFFBEB', border: '#FEF3C7', text: '#92400E', badge: '#F59E0B' },
                                HARD: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', badge: '#EF4444' },
                            }[diff as 'EASY' | 'MEDIUM' | 'HARD'] || { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569', badge: '#64748B' };

                            return (
                                <View 
                                    key={q.id} 
                                    style={[
                                        styles.detailCard, 
                                        { backgroundColor: colors.bg, borderColor: colors.border },
                                        isDark && { backgroundColor: '#111827', borderColor: '#374151' }
                                    ]}
                                >
                                    <View style={styles.detailHeader}>
                                        <Text style={[styles.detailNum, { color: colors.text }]}>{i + 1}. Soru</Text>
                                        <View style={[styles.scoreBadge, { backgroundColor: colors.badge }]}>
                                            <Text style={styles.scoreText}>{q.score || 0}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.detailQuestion, isDark && styles.textDark]}>{q.questionText}</Text>
                                    <Text style={styles.detailAnswerTitle}>Cevabın:</Text>
                                    <Text style={[styles.detailAnswer, isDark && styles.textDark]}>{q.answerText || 'Cevaplanmadı'}</Text>
                                    {q.feedback && (
                                        <>
                                            <Text style={[styles.detailFeedbackTitle, { color: colors.badge }]}>AI Geri Bildirimi:</Text>
                                            <Text style={[styles.detailFeedback, isDark && styles.textDark]}>{q.feedback}</Text>
                                        </>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => router.replace('/(work)/events')}
                    >
                        <Text style={styles.secondaryBtnText}>Ana Menüye Dön</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND, gap: 16 },
    loadingText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 64,
        gap: 16,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1E293B' },
    statusBadge: {
        backgroundColor: SECONDARY,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: { fontSize: 11, fontWeight: '800', color: PRIMARY },
    viewContainer: { flex: 1, padding: 20 },
    answeringContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    title: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 24, lineHeight: 20 },
    scrollList: { flex: 1 },
    emptyQuestionsBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    emptyQuestionsText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    questionItem: {
        flexDirection: 'row',
        backgroundColor: CARD_BG,
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    questionNumCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: SECONDARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    questionNum: { fontSize: 16, fontWeight: '800', color: PRIMARY },
    questionTxt: { flex: 1, fontSize: 15, color: '#334155', fontWeight: '600', lineHeight: 22 },
    questionActions: { flexDirection: 'row', gap: 4, marginLeft: 8 },
    qActionBtn: {
        width: 30, height: 30, borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
    },
    primaryBtn: {
        backgroundColor: PRIMARY,
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 6,
        marginTop: 16,
    },
    primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    progressContainer: { marginBottom: 24 },
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
    progressPercent: { fontSize: 13, fontWeight: '800', color: PRIMARY },
    progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
    questionCard: {
        backgroundColor: PRIMARY,
        borderRadius: 32,
        padding: 28,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardIcon: { marginBottom: 16 },
    activeQuestion: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        lineHeight: 30,
    },
    inputArea: {
        minHeight: 200,
        backgroundColor: CARD_BG,
        borderRadius: 28,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    answerInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
        lineHeight: 24,
    },
    actionRow: { 
        flexDirection: 'row', 
        gap: 16, 
        marginTop: 24,
        elevation: 4,
    },
    backBtn: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: SECONDARY,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    micBtn: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: SUCCESS,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: SUCCESS,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    micBtnActive: {
        backgroundColor: '#EF4444', // Red when recording
        transform: [{ scale: 1.1 }],
    },
    nextBtn: {
        flex: 1,
        backgroundColor: PRIMARY,
        borderRadius: 24,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    disabledBtn: { opacity: 0.5 },
    completedContent: { padding: 24, alignItems: 'center' },
    scoreContainer: { alignItems: 'center', marginBottom: 32 },
    scoreCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#fff',
        borderWidth: 10,
        borderColor: SUCCESS,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: SUCCESS,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        marginBottom: 16,
    },
    scoreVal: { fontSize: 44, fontWeight: '900', color: '#1E293B' },
    scoreMax: { fontSize: 16, fontWeight: '700', color: '#94A3B8', marginTop: 12 },
    scoreLabel: { fontSize: 16, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
    feedbackSection: { width: '100%', marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, marginLeft: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    feedbackCard: {
        backgroundColor: '#EEF2FF',
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    feedbackText: { fontSize: 15, color: '#312E81', lineHeight: 26, fontWeight: '500' },
    secondaryBtn: {
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        width: '100%',
        alignItems: 'center',
    },
    secondaryBtnText: { color: '#475569', fontSize: 16, fontWeight: '800' },

    /* ─── Difficulty Badges ─── */
    diffBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    diffEASY: { backgroundColor: '#BBF7D0', borderColor: '#22C55E', borderWidth: 1 },
    diffMEDIUM: { backgroundColor: '#FEF08A', borderColor: '#EAB308', borderWidth: 1 },
    diffHARD: { backgroundColor: '#FECACA', borderColor: '#EF4444', borderWidth: 1 },
    diffText: { fontSize: 10, fontWeight: '900', color: '#1E293B' },
    
    activeDiffBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    activeDiffText: { fontSize: 12, fontWeight: '900', color: '#1E293B' },

    /* ─── Detail Result Cards ─── */
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    detailNum: { fontSize: 14, fontWeight: '800', color: '#64748B' },
    scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    scoreHigh: { backgroundColor: '#10B981' },
    scoreMed: { backgroundColor: '#F59E0B' },
    scoreLow: { backgroundColor: '#EF4444' },
    scoreText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    detailQuestion: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    detailAnswerTitle: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 4 },
    detailAnswer: { fontSize: 14, color: '#334155', marginBottom: 16, fontStyle: 'italic' },
    detailFeedbackTitle: { fontSize: 12, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
    detailFeedback: { fontSize: 14, color: '#334155', lineHeight: 22 },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});

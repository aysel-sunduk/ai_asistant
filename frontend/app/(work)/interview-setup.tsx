import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { interviewService } from '../../services/interview.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PRIMARY = '#4F46E5'; // Indigo
const ACCENT = '#6366F1';
const BACKGROUND = '#F8FAFC';
const CARD_BG = '#FFFFFF';

export default function InterviewSetupScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [position, setPosition] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [interviewDate, setInterviewDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleCreate = async () => {
        if (!title.trim() || !position.trim()) {
            Alert.alert('Eksik Bilgi', 'Mülakatın odaklanması için en azından başlık ve pozisyon bilgilerini doldurmalısın.');
            return;
        }

        try {
            setLoading(true);
            const session = await interviewService.createSession({
                title: title.trim(),
                position: position.trim(),
                jobDescription: jobDescription.trim(),
                interviewDate: interviewDate ? interviewDate.toISOString() : undefined,
            });

            router.push({
                pathname: '/(work)/interview-session',
                params: { sessionId: session.id }
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Hay aksi!', 'Mülakat hazırlarken küçük bir sorun çıktı. Tekrar deneyebilir misin?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>Mülakat Hazırlığı</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mascotInfo}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="rocket-outline" size={28} color={PRIMARY} />
                    </View>
                    <View style={styles.mascotTextContainer}>
                        <Text style={styles.mascotTitle}>Yolculuğa Hazır mısın?</Text>
                        <Text style={styles.mascotText}>
                            Seni işe alacakmışız gibi en gerçekçi soruları hazırlayacağım. Tek yapman gereken bilgileri girmek!
                        </Text>
                    </View>
                </View>

                <View style={[styles.card, isDark && styles.cardDark]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Mülakat Başlığı</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="document-text-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, isDark && styles.inputDark]}
                                placeholder="Örn: Google Frontend Developer Mülakatı"
                                placeholderTextColor="#94A3B8"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Hedeflenen Pozisyon</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="briefcase-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, isDark && styles.inputDark]}
                                placeholder="Örn: Senior React Native Developer"
                                placeholderTextColor="#94A3B8"
                                value={position}
                                onChangeText={setPosition}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && styles.subTextDark]}>İş Tanımı (Önerilir)</Text>
                        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="İlan detaylarını buraya eklersen çok daha nokta atışı sorular hazırlarım..."
                                placeholderTextColor="#94A3B8"
                                value={jobDescription}
                                onChangeText={setJobDescription}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Mülakat Tarihi</Text>
                        <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                            <Text style={[styles.input, { paddingVertical: 14, color: interviewDate ? '#1E293B' : '#94A3B8' }]}>
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
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.mainBtn, loading && styles.disabledBtn]}
                    onPress={handleCreate}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.mainBtnText}>Mülakatı Başlat</Text>
                            <Ionicons name="sparkles" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
    scroll: { padding: 20 },
    mascotInfo: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    mascotTextContainer: { flex: 1 },
    mascotTitle: { fontSize: 17, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
    mascotText: { fontSize: 13, color: '#475569', lineHeight: 18, fontWeight: '500' },
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
        marginBottom: 24,
        gap: 20,
    },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    textAreaWrapper: { alignItems: 'flex-start', paddingVertical: 12 },
    textArea: { height: 100, paddingTop: 0 },
    mainBtn: {
        backgroundColor: PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 12,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    disabledBtn: { opacity: 0.6 },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import type { InterviewSession } from '../../src/models/interview.model';

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
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [session, setSession] = useState<InterviewSession | null>(null);

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mülakat Detayı</Text>
                    <View style={styles.iconBtnGhost} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSession(true)} />}
            >
                <View style={styles.card}>
                    <Text style={styles.title}>{session.title}</Text>
                    <Text style={styles.position}>{session.position}</Text>

                    <View style={styles.metaRow}>
                        <Meta label="Tarih" value={formatDateVerbose(session.interviewDate)} />
                        <Meta label="Durum" value={STATUS_LABELS[session.status] || session.status} />
                        <Meta label="Soru" value={`${session.questions?.length || 0}`} />
                    </View>

                    <Text style={styles.sectionTitle}>İş Tanımı</Text>
                    <Text style={styles.description}>
                        {session.jobDescription?.trim() || 'Bu mülakat için henüz iş tanımı eklenmemiş.'}
                    </Text>
                </View>

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
            </ScrollView>
        </View>
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
});

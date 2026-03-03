// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGoals } from '../../src/hooks/useGoals';
import { goalsService } from '../../services/goals.service';

const COLOR = '#FFD93D';
const DARK = '#B8860B';
const CATEGORY_LABELS: Record<string, string> = {
    saglik: 'Sağlık',
    health: 'Sağlık',
    finans: 'Finans',
    finance: 'Finans',
    egitim: 'Eğitim',
    education: 'Eğitim',
    kariyer: 'Kariyer',
    career: 'Kariyer',
    kisisel: 'Kişisel',
    personal: 'Kişisel',
};

export default function GoalDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const goalId = typeof params.id === 'string' ? params.id : '';

    const { selectedGoal, isLoading, fetchGoalById, updateProgress, updateCompletion } = useGoals();
    const [busy, setBusy] = useState(false);
    const [progressInput, setProgressInput] = useState('0');

    // AI Motivation States
    const [motivationMessage, setMotivationMessage] = useState<string | null>(null);
    const [motivationLoading, setMotivationLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            if (goalId) {
                fetchGoalById(goalId);
                setMotivationMessage(null);
            }
        }, [goalId, fetchGoalById]),
    );

    useFocusEffect(
        useCallback(() => {
            if (selectedGoal) {
                setProgressInput(String(selectedGoal.progressPct ?? 0));
            }
        }, [selectedGoal]),
    );

    const progress = selectedGoal?.progressPct ?? 0;
    const isCompleted = selectedGoal?.isCompleted ?? false;

    const statusText = useMemo(() => {
        if (!selectedGoal) return '-';
        if (selectedGoal.isCompleted) return 'Tamamlandi';
        if (selectedGoal.progressPct >= 75) return 'Iyi gidiyor';
        if (selectedGoal.progressPct >= 40) return 'Devam ediyor';
        return 'Baslangic asamasi';
    }, [selectedGoal]);

    const handleSaveProgress = async () => {
        if (!selectedGoal || busy) return;
        const parsed = Number(progressInput);
        if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
            Alert.alert('Gecersiz deger', 'Ilerleme 0 ile 100 arasinda olmalidir.');
            return;
        }
        const next = Math.round(parsed);
        setBusy(true);
        try {
            await updateProgress(selectedGoal.id, next);
        } finally {
            setBusy(false);
        }
    };

    const toggleCompletion = async () => {
        if (!selectedGoal || busy) return;
        setBusy(true);
        try {
            await updateCompletion(selectedGoal.id, !selectedGoal.isCompleted);
        } finally {
            setBusy(false);
        }
    };

    const fetchMotivation = async () => {
        if (!selectedGoal || motivationLoading) return;
        setMotivationLoading(true);
        setMotivationMessage(null);
        try {
            const result = await goalsService.getMotivation(selectedGoal.id);
            setMotivationMessage(result.message);
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        } catch (err) {
            Alert.alert('Hata', 'Motivasyon mesaji alinamadi.');
        } finally {
            setMotivationLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hedef Detayi</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {isLoading && !selectedGoal ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="small" color={DARK} />
                </View>
            ) : !selectedGoal ? (
                <View style={styles.centerState}>
                    <Text style={styles.emptyTitle}>Hedef bulunamadi.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.title}>{selectedGoal.title}</Text>
                        <Text style={styles.sub}>{selectedGoal.description || 'Aciklama yok'}</Text>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Kategori</Text>
                            <Text style={styles.metaValue}>
                                {selectedGoal.category ? (CATEGORY_LABELS[selectedGoal.category] || selectedGoal.category) : '-'}
                            </Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Hedef Tarih</Text>
                            <Text style={styles.metaValue}>{selectedGoal.targetDate || '-'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Durum</Text>
                            <Text style={styles.metaValue}>{statusText}</Text>
                        </View>

                        <View style={styles.progressWrap}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                        </View>

                        <View style={styles.editorSection}>
                            <Text style={styles.editorLabel}>Ilerleme duzenle (0-100)</Text>
                            <View style={styles.editorRow}>
                                <TextInput
                                    style={styles.progressInput}
                                    keyboardType="number-pad"
                                    value={progressInput}
                                    onChangeText={setProgressInput}
                                    maxLength={3}
                                />
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProgress} disabled={busy}>
                                    <Text style={styles.saveBtnText}>Kaydet</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.quickRow}>
                                {[0, 25, 50, 75, 100].map((v) => (
                                    <TouchableOpacity key={v} style={styles.quickChip} onPress={() => setProgressInput(String(v))}>
                                        <Text style={styles.quickChipText}>%{v}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* AI Motivation Section */}
                        <View style={styles.motivationSection}>
                            <TouchableOpacity
                                style={[styles.motivationBtn, motivationLoading && { opacity: 0.7 }]}
                                onPress={fetchMotivation}
                                disabled={motivationLoading}
                            >
                                {motivationLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="sparkles" size={18} color="#fff" />
                                )}
                                <Text style={styles.motivationBtnText}>
                                    {motivationLoading ? 'Düşünüyorum...' : '✨ AI Motivasyon Al'}
                                </Text>
                            </TouchableOpacity>

                            {motivationMessage && (
                                <Animated.View style={[styles.motivationCard, { opacity: fadeAnim }]}>
                                    <View style={styles.motivationHeader}>
                                        <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                                        <Text style={styles.motivationLabel}>AI Motivasyon</Text>
                                    </View>
                                    <Text style={styles.motivationText}>{motivationMessage}</Text>
                                </Animated.View>
                            )}
                        </View>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.completeBtn, isCompleted && styles.completeBtnDone]}
                                onPress={toggleCompletion}
                                disabled={busy}
                            >
                                <Text style={[styles.completeBtnText, isCompleted && styles.completeBtnTextDone]}>
                                    {isCompleted ? 'Geri Ac' : 'Tamamla'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 20,
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: DARK },
    scroll: { padding: 16 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    card: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    title: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
    sub: { marginTop: 6, fontSize: 13, color: '#64748B' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    metaLabel: { fontSize: 12, color: '#64748B', fontWeight: '700' },
    metaValue: { fontSize: 12, color: '#1A1A2E', fontWeight: '700' },
    progressWrap: { marginTop: 16 },
    progressBar: { height: 8, borderRadius: 4, backgroundColor: '#F1F5F9' },
    progressFill: { height: 8, borderRadius: 4, backgroundColor: COLOR },
    editorSection: { marginTop: 14 },
    editorLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', marginBottom: 6 },
    editorRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    progressInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    saveBtn: {
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    saveBtnText: { color: '#92400E', fontWeight: '800' },
    quickRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
    quickChip: {
        borderWidth: 1,
        borderColor: '#FDE68A',
        backgroundColor: '#FFFBEB',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    quickChipText: { fontSize: 12, color: '#92400E', fontWeight: '700' },

    // AI Motivation Styles
    motivationSection: { marginTop: 16 },
    motivationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    motivationBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    motivationCard: {
        marginTop: 12,
        backgroundColor: '#FFFBEB',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    motivationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    motivationLabel: { fontSize: 13, fontWeight: '800', color: '#92400E' },
    motivationText: { fontSize: 14, color: '#78350F', lineHeight: 22 },

    actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    completeBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#D1FAE5',
    },
    completeBtnDone: { backgroundColor: '#FEE2E2' },
    completeBtnText: { color: '#065F46', fontWeight: '800' },
    completeBtnTextDone: { color: '#B91C1C' },
});
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { gamesService } from '../../services/games.service';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const { width } = Dimensions.get('window');
const COLOR = '#A78BFA';

export default function PerformanceStatsScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState<any>(null);
    const [motivationData, setMotivationData] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [trend, motivation] = await Promise.all([
                gamesService.getPerformanceTrend('memory'),
                gamesService.getMotivation('memory').catch(() => null),
            ]);
            setTrendData(trend);
            setMotivationData(motivation);
        } catch (err) {
            console.warn('Data load failed', err);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = () => {
        if (!trendData) return 'remove';
        switch (trendData.trend) {
            case 'yükseliş': return 'trending-up';
            case 'düşüş': return 'trending-down';
            default: return 'remove';
        }
    };

    const getTrendColor = () => {
        if (!trendData) return '#64748B';
        switch (trendData.trend) {
            case 'yükseliş': return '#4ADE80';
            case 'düşüş': return '#F87171';
            default: return '#94A3B8';
        }
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>Performans Analizi</Text>
                    <TouchableOpacity onPress={loadData} style={styles.backBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                        <Text style={[styles.loadingText, isDark && styles.subTextDark]}>AI Verileriniz Analiz Ediliyor...</Text>
                    </View>
                ) : trendData ? (
                    <>
                        {/* Motivasyon Mesajı Card */}
                        {motivationData && (
                            <View style={[styles.motivationCard, isDark && styles.motivationCardDark]}>
                                <Text style={styles.motivationEmoji}>💬</Text>
                                <Text style={[styles.motivationMessage, isDark && styles.motivationMessageDark]}>{motivationData.message}</Text>
                                {motivationData.confidence && (
                                    <Text style={[styles.motivationMeta, isDark && styles.motivationMetaDark]}>
                                        AI güven: %{(motivationData.confidence * 100).toFixed(0)} • {motivationData.labelName}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Summary Card */}
                        <View style={[styles.mainCard, isDark && styles.mainCardDark]}>
                            <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
                                <Ionicons name={getTrendIcon() as any} size={24} color={getTrendColor()} />
                                <Text style={[styles.trendText, { color: getTrendColor() }]}>
                                    Trend: {trendData.trend.toUpperCase()}
                                </Text>
                            </View>

                            <Text style={[styles.improvementVal, isDark && styles.textDark]}>%{trendData.improvementPct.toFixed(1)}</Text>
                            <Text style={[styles.improvementLabel, isDark && styles.subTextDark]}>Haftalık Gelişim Oranı</Text>

                            <View style={[styles.divider, isDark && styles.dividerDark]} />

                            <View style={styles.aiMessageContainer}>
                                <Text style={styles.aiLabel}>🤖 AI Notu:</Text>
                                <Text style={[styles.aiMessage, isDark && styles.aiMessageDark]}>{trendData.message}</Text>
                            </View>
                        </View>

                        {/* Chart Area */}
                        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Haftalık Skor Grafiği</Text>
                        <View style={[styles.chartCard, isDark && styles.mainCardDark]}>
                            <View style={styles.chartHeader}>
                                <Text style={[styles.chartSub, isDark && styles.subTextDark]}>Son 7 gün ortalama skorların</Text>
                            </View>

                            <View style={styles.barContainer}>
                                {trendData.weeklyAvgScores && trendData.weeklyAvgScores.map((score: number, idx: number) => {
                                    const max = Math.max(...trendData.weeklyAvgScores, 1);
                                    const height = (score / max) * 150;
                                    return (
                                        <View key={idx} style={styles.barWrapper}>
                                            <View style={[styles.bar, { height: Math.max(height, 5) }]} />
                                            <Text style={[styles.barLabel, isDark && styles.subTextDark]}>{idx + 1}. G</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Analysis Footer */}
                        <View style={[styles.infoBox, isDark && styles.infoBoxDark]}>
                            <Ionicons name="information-circle-outline" size={20} color={isDark ? '#6B7280' : '#64748B'} />
                            <Text style={[styles.infoText, isDark && styles.subTextDark]}>
                                Bu analiz Linear Regression ve RandomForest modelleri kullanılarak gerçek oyun geçmişinden üretilmiştir.
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.centered}>
                        <Text>Veri bulunamadı.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    content: { padding: 20, paddingBottom: 40 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    loadingText: { marginTop: 16, fontSize: 14, color: '#64748B', fontWeight: '600' },

    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 99,
        marginBottom: 20,
    },
    trendText: { fontWeight: '800', fontSize: 12 },
    improvementVal: { fontSize: 48, fontWeight: '900', color: '#1E293B' },
    improvementLabel: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 4 },
    divider: { width: '100%', height: 1, backgroundColor: '#F1F5F9', marginVertical: 24 },
    aiMessageContainer: { alignSelf: 'stretch' },
    aiLabel: { fontSize: 12, fontWeight: '800', color: COLOR, marginBottom: 8 },
    aiMessage: { fontSize: 14, color: '#334155', lineHeight: 22 },

    sectionTitle: { marginTop: 30, marginBottom: 16, fontSize: 18, fontWeight: '800', color: '#1E293B' },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    chartHeader: { marginBottom: 20 },
    chartSub: { fontSize: 12, color: '#64748B' },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 180,
    },
    barWrapper: { alignItems: 'center' },
    bar: {
        width: 32,
        backgroundColor: COLOR,
        borderRadius: 8,
        marginBottom: 8,
        opacity: 0.8,
    },
    barLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

    infoBox: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 24,
        backgroundColor: '#F1F5F9',
        padding: 16,
        borderRadius: 16,
    },
    infoText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18 },

    motivationCard: {
        backgroundColor: '#EDE9FE',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#C4B5FD',
    },
    motivationEmoji: { fontSize: 32, marginBottom: 10 },
    motivationMessage: { fontSize: 16, fontWeight: '700', color: '#4C1D95', textAlign: 'center', lineHeight: 24 },
    motivationMeta: { marginTop: 10, fontSize: 11, color: '#7C3AED', fontWeight: '600' },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    mainCardDark: { backgroundColor: '#111827', shadowOpacity: 0 },
    dividerDark: { backgroundColor: '#1F2937' },
    aiMessageDark: { color: '#CBD5E1' },
    infoBoxDark: { backgroundColor: '#1E293B' },
    motivationCardDark: { backgroundColor: '#1E1B4B', borderColor: '#312E81' },
    motivationMessageDark: { color: '#C4B5FD' },
    motivationMetaDark: { color: '#A78BFA' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});

// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { formatTime, getBestResult, getGameResults, type GameResult } from '../../src/utils/game.utils';
import type { FrontendGameType } from '../../src/models/game.model';
import { gamesService } from '../../services/games.service';

const COLOR = '#A78BFA';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface GameInfo {
    id: string;
    key: FrontendGameType;
    title: string;
    desc: string;
    icon: IoniconsName;
    route: string;
    bestLabel: string;
}

const GAMES: GameInfo[] = [
    { id: '1', key: 'memory', title: 'Hafıza Oyunu', desc: 'Kartları eşleştir', icon: 'grid-outline', route: '/(games)/memory', bestLabel: 'süre' },
    { id: '2', key: '2048', title: '2048', desc: 'Sayı bulmacası', icon: 'cube-outline', route: '/(games)/quiz', bestLabel: 'skor' },
    { id: '3', key: 'sudoku', title: 'Sudoku', desc: 'Klasik bulmaca', icon: 'apps-outline', route: '/(games)/sudoku', bestLabel: 'süre' },
];

export default function GameListScreen() {
    const router = useRouter();
    const [bestResults, setBestResults] = useState<Record<string, GameResult | null>>({});
    const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
    const [segmentInfo, setSegmentInfo] = useState<{ segment: string, message: string } | null>(null);
    const [motivationInfo, setMotivationInfo] = useState<{ message: string, labelName: string, confidence?: number } | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                const bests: Record<string, GameResult | null> = {};
                const counts: Record<string, number> = {};
                for (const game of GAMES) {
                    bests[game.key] = await getBestResult(game.key);
                    const results = await getGameResults(game.key);
                    counts[game.key] = results.length;
                }
                setBestResults(bests);
                setPlayCounts(counts);

                // Load AI Segment + Motivation
                setAiLoading(true);
                try {
                    const [segData, motData] = await Promise.all([
                        gamesService.getPlayerSegment('memory').catch(() => null),
                        gamesService.getMotivation('memory').catch(() => null),
                    ]);
                    if (segData) setSegmentInfo(segData);
                    if (motData) setMotivationInfo(motData);
                } catch (err) {
                    console.warn('Failed to load AI data', err);
                } finally {
                    setAiLoading(false);
                }
            };
            loadData();
        }, [])
    );

    const getBestDisplay = (game: GameInfo): string => {
        const best = bestResults[game.key];
        if (!best) return '—';
        if (game.key === '2048') return `${best.score || 0}`;
        return formatTime(best.time);
    };

    const totalPlays = Object.values(playCounts).reduce((sum, c) => sum + c, 0);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🎮 Oyunlar</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(games)/leaderboard' as any)}
                        style={styles.backBtn}
                    >
                        <Ionicons name="podium-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="trophy" size={20} color="#FFD93D" />
                        <Text style={styles.statNum}>{totalPlays}</Text>
                        <Text style={styles.statLabel}>Toplam Oynama</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Ionicons name="game-controller" size={20} color="#4ADE80" />
                        <Text style={styles.statNum}>{GAMES.length}</Text>
                        <Text style={styles.statLabel}>Oyun</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* AI Segment Banner */}
                {aiLoading ? (
                    <View style={styles.aiBannerLoading}>
                        <ActivityIndicator color={COLOR} />
                    </View>
                ) : segmentInfo ? (
                    <View style={styles.aiBanner}>
                        <View style={styles.aiHeader}>
                            <View style={[styles.segmentBadge, { backgroundColor: getSegmentColor(segmentInfo.segment) }]}>
                                <Text style={styles.segmentBadgeText}>{segmentInfo.segment}</Text>
                            </View>
                            <Text style={styles.aiLabel}>✨ AI Oyuncu Analizi</Text>
                        </View>
                        <Text style={styles.aiMessage}>{segmentInfo.message}</Text>

                        {/* Motivasyon Mesajı */}
                        {motivationInfo && (
                            <View style={styles.motivationBox}>
                                <Text style={styles.motivationMsg}>💬 {motivationInfo.message}</Text>
                                {motivationInfo.confidence && (
                                    <Text style={styles.motivationMeta}>
                                        🤖 AI güven: %{(motivationInfo.confidence * 100).toFixed(0)}
                                    </Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.statsBtn}
                            onPress={() => router.push('/(games)/performance-stats' as any)}
                        >
                            <Text style={styles.statsBtnText}>Detaylı İstatistikler</Text>
                            <Ionicons name="stats-chart" size={14} color={COLOR} />
                        </TouchableOpacity>
                    </View>
                ) : null}

                {GAMES.map((g) => (
                    <TouchableOpacity
                        key={g.id}
                        style={styles.card}
                        activeOpacity={0.7}
                        onPress={() => router.push(g.route as any)}
                    >
                        <View style={styles.iconBox}>
                            <Ionicons name={g.icon} size={24} color={COLOR} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{g.title}</Text>
                            <Text style={styles.cardSub}>{g.desc}</Text>
                        </View>
                        <View style={styles.rightCol}>
                            <Text style={styles.bestLabel}>En iyi</Text>
                            <Text style={styles.bestVal}>{getBestDisplay(g)}</Text>
                            <Text style={styles.playsText}>{playCounts[g.key] || 0} oynama</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#C4C4C4" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                ))}

            </ScrollView>
        </View>
    );
}

const getSegmentColor = (segment: string) => {
    switch (segment) {
        case 'Başlangıç': return '#94A3B8';
        case 'Gelişen': return '#38BDF8';
        case 'Düzenli': return '#818CF8';
        case 'Usta': return '#F59E0B';
        default: return '#A78BFA';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        paddingBottom: 20, shadowColor: COLOR, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 32 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    iconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLOR + '15', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    cardSub: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    rightCol: { alignItems: 'flex-end' },
    bestLabel: { fontSize: 10, color: '#9BA1A6' },
    bestVal: { fontSize: 16, fontWeight: '800', color: COLOR },
    playsText: { fontSize: 10, color: '#C4C4C4', marginTop: 2 },


    // AI Banner Styles
    aiBannerLoading: { height: 120, justifyContent: 'center', alignItems: 'center' },
    aiBanner: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    aiLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    segmentBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    segmentBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    aiMessage: { fontSize: 15, lineHeight: 22, color: '#1E293B', fontWeight: '600', marginBottom: 16 },
    statsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLOR,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    statsBtnText: { color: COLOR, fontSize: 13, fontWeight: '700' },

    motivationBox: {
        backgroundColor: '#EDE9FE',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#C4B5FD',
    },
    motivationMsg: { fontSize: 14, fontWeight: '700', color: '#4C1D95', lineHeight: 20 },
    motivationMeta: { marginTop: 6, fontSize: 11, color: '#7C3AED', fontWeight: '600' },
});
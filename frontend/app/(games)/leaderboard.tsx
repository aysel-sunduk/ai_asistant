import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gamesService } from '../../services/games.service';
import type { FrontendGameType, GameRankSummary, GameScore } from '../../src/models/game.model';
import { useAuthStore } from '../../src/store/auth.store';
import { formatTime } from '../../src/utils/game.utils';

const COLOR = '#A78BFA';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: FrontendGameType; label: string; icon: IoniconsName }[] = [
    { key: 'memory', label: 'Hafiza', icon: 'grid-outline' },
    { key: '2048', label: '2048', icon: 'cube-outline' },
    { key: 'sudoku', label: 'Sudoku', icon: 'apps-outline' },
];

const normalizeGameType = (gameType: string): FrontendGameType => (gameType === 'quiz' ? '2048' : gameType as FrontendGameType);

const getDisplayName = (row: GameScore): string => {
    const fullName = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();
    if (fullName.length > 0) return fullName;
    return `Kullanici ${row.userId.slice(0, 8)}`;
};

const getInitials = (row: GameScore): string => {
    const first = (row.firstName ?? '').trim().charAt(0);
    const last = (row.lastName ?? '').trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();
    return initials || row.userId.slice(0, 2).toUpperCase();
};

const formatScore = (row: GameScore, activeTab: FrontendGameType): string => {
    if (activeTab === '2048') {
        const durationText = row.duration != null ? ` - ${formatTime(row.duration * 1000)}` : '';
        return `${row.score}${durationText}`;
    }
    if (row.duration != null) {
        return formatTime(row.duration * 1000);
    }
    return `${row.score}`;
};

const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '\u{1F947}';
    if (rank === 2) return '\u{1F948}';
    if (rank === 3) return '\u{1F949}';
    return '';
};

const getPercentileText = (rank: number | null, count: number): string => {
    if (!rank || count <= 0) return '-';
    const pct = Math.max(0, Math.min(100, Math.round(((count - rank + 1) / count) * 100)));
    return `%${pct}`;
};

export default function LeaderboardScreen() {
    const router = useRouter();
    const authUserId = useAuthStore((state) => state.user?.id);
    const [activeTab, setActiveTab] = useState<FrontendGameType>('memory');
    const [rows, setRows] = useState<GameScore[]>([]);
    const [rankSummary, setRankSummary] = useState<GameRankSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const leaderboardPromise = gamesService.getLeaderboard(activeTab, 50);
                const summaryPromise = gamesService.getRankSummary(activeTab).catch((summaryError) => {
                    console.warn('[Leaderboard] rank-summary request failed, continuing without summary', summaryError);
                    return null;
                });

                const [leaderboard, summary] = await Promise.all([leaderboardPromise, summaryPromise]);
                if (!cancelled) {
                    setRows(leaderboard.map((row) => ({
                        ...row,
                        gameType: normalizeGameType(row.gameType),
                    })));
                    setRankSummary(summary);
                }
            } catch (e) {
                if (!cancelled) {
                    setRows([]);
                    setRankSummary(null);
                    setError('Skor tablosu yuklenemedi.');
                    console.warn('[Leaderboard] Failed to fetch leaderboard', e);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [activeTab]);

    const podiumData = useMemo(() => {
        const ranked = rows.map((row, index) => ({ row, rank: index + 1 }));
        return {
            first: ranked[0],
            second: ranked[1],
            third: ranked[2],
            rest: ranked.slice(3),
        };
    }, [rows]);

    const summaryPanel = rankSummary ? (
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <View style={styles.summaryTitleWrap}>
                    <Ionicons name="analytics-outline" size={16} color="#5F46D5" />
                    <Text style={styles.summaryTitle}>Siralama Ozeti</Text>
                </View>
                <Text style={styles.summaryBadge}>{activeTab.toUpperCase()}</Text>
            </View>

            <View style={styles.metricGrid}>
                <View style={styles.metricCard}>
                    <Ionicons name="earth-outline" size={14} color="#5F46D5" />
                    <Text style={styles.metricLabel}>Global</Text>
                    <Text style={styles.metricValue}>{rankSummary.globalRank ?? '-'} / {rankSummary.globalPlayerCount}</Text>
                </View>
                <View style={styles.metricCard}>
                    <Ionicons name="people-outline" size={14} color="#5F46D5" />
                    <Text style={styles.metricLabel}>Arkadas</Text>
                    <Text style={styles.metricValue}>{rankSummary.friendsRank ?? '-'} / {rankSummary.friendsPlayerCount}</Text>
                </View>
                <View style={styles.metricCard}>
                    <Ionicons name="trophy-outline" size={14} color="#5F46D5" />
                    <Text style={styles.metricLabel}>En Iyi Skor</Text>
                    <Text style={styles.metricValue}>{rankSummary.bestScore ?? '-'}</Text>
                </View>
            </View>

            <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Global Yuzdelik</Text>
                <Text style={styles.progressValue}>{getPercentileText(rankSummary.globalRank, rankSummary.globalPlayerCount)}</Text>
            </View>
            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: getPercentileText(rankSummary.globalRank, rankSummary.globalPlayerCount) === '-'
                                ? '0%'
                                : getPercentileText(rankSummary.globalRank, rankSummary.globalPlayerCount).replace('%', '') + '%',
                        },
                    ]}
                />
            </View>
        </View>
    ) : null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Skor Tablosu</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.tabs}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? COLOR : 'rgba(255,255,255,0.6)'} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={COLOR} />
                </View>
            ) : error ? (
                <View style={styles.centerState}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : rows.length === 0 ? (
                <View style={styles.centerState}>
                    <Text style={styles.emptyText}>Bu oyun icin henuz skor yok.</Text>
                </View>
            ) : rows.length < 3 ? (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {summaryPanel}
                    {rows.map((row, index) => (
                        <View key={row.id} style={styles.singleCard}>
                            <Text style={styles.singleMedal}>{getMedalEmoji(index + 1)}</Text>
                            <View style={styles.singleAvatar}><Text style={styles.avatarText}>{getInitials(row)}</Text></View>
                            <Text style={styles.singleName}>{getDisplayName(row)}</Text>
                            <Text style={styles.singleScore}>{formatScore(row, activeTab)}</Text>
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <>
                    {rankSummary && <View style={styles.summaryWrap}>{summaryPanel}</View>}
                    <View style={styles.podium}>
                        {podiumData.second && (
                            <View style={styles.podiumItem}>
                                <View style={styles.avatarWrap}><Text style={styles.avatarText}>{getInitials(podiumData.second.row)}</Text></View>
                                <View style={[styles.podiumBar, styles.podiumBar2]}><Text style={styles.podiumRank}>{getMedalEmoji(2)}</Text></View>
                                <Text style={styles.podiumName}>{getDisplayName(podiumData.second.row)}</Text>
                                <Text style={styles.podiumScore}>{formatScore(podiumData.second.row, activeTab)}</Text>
                            </View>
                        )}

                        {podiumData.first && (
                            <View style={styles.podiumItem}>
                                <View style={[styles.avatarWrap, styles.avatarWrapFirst]}><Text style={styles.avatarText}>{getInitials(podiumData.first.row)}</Text></View>
                                <View style={[styles.podiumBar, styles.podiumBar1]}><Text style={styles.podiumRank}>{getMedalEmoji(1)}</Text></View>
                                <Text style={[styles.podiumName, { fontWeight: '800' }]}>{getDisplayName(podiumData.first.row)}</Text>
                                <Text style={[styles.podiumScore, { color: COLOR }]}>{formatScore(podiumData.first.row, activeTab)}</Text>
                            </View>
                        )}

                        {podiumData.third && (
                            <View style={styles.podiumItem}>
                                <View style={styles.avatarWrap}><Text style={styles.avatarText}>{getInitials(podiumData.third.row)}</Text></View>
                                <View style={[styles.podiumBar, styles.podiumBar3]}><Text style={styles.podiumRank}>{getMedalEmoji(3)}</Text></View>
                                <Text style={styles.podiumName}>{getDisplayName(podiumData.third.row)}</Text>
                                <Text style={styles.podiumScore}>{formatScore(podiumData.third.row, activeTab)}</Text>
                            </View>
                        )}
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {podiumData.rest.map((entry) => {
                            const isCurrentUser = authUserId === entry.row.userId;
                            return (
                                <View key={entry.row.id} style={[styles.row, isCurrentUser && styles.rowCurrentUser]}>
                                    <Text style={styles.rankText}>{entry.rank}</Text>
                                    <View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>{getInitials(entry.row)}</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.username, isCurrentUser && styles.usernameHighlight]}>
                                            {getDisplayName(entry.row)}{isCurrentUser ? ' (Sen)' : ''}
                                        </Text>
                                    </View>
                                    <Text style={[styles.score, isCurrentUser && styles.scoreHighlight]}>{formatScore(entry.row, activeTab)}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </>
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
        paddingBottom: 16,
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },

    tabs: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 8 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)',
    },
    tabActive: { backgroundColor: '#fff' },
    tabText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    tabTextActive: { color: COLOR },

    podium: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
        paddingHorizontal: 20, paddingTop: 20, gap: 12,
    },
    podiumItem: { alignItems: 'center', flex: 1 },
    avatarWrap: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#E9E3FF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    avatarWrapFirst: { width: 42, height: 42, borderRadius: 21 },
    avatarText: { color: COLOR, fontSize: 12, fontWeight: '800' },
    podiumBar: {
        width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12,
        alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8,
    },
    podiumBar1: { height: 80, backgroundColor: '#FFD93D33' },
    podiumBar2: { height: 60, backgroundColor: '#C0C0C033' },
    podiumBar3: { height: 44, backgroundColor: '#CD7F3233' },
    podiumRank: { fontSize: 20 },
    podiumName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginTop: 6, textAlign: 'center' },
    podiumScore: { fontSize: 12, fontWeight: '600', color: '#9BA1A6', marginTop: 2 },

    scroll: { padding: 16, paddingBottom: 40 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    rowCurrentUser: {
        backgroundColor: COLOR + '12', borderWidth: 1.5, borderColor: COLOR + '40',
    },
    rankText: { fontSize: 14, fontWeight: '800', color: '#9BA1A6', width: 24, textAlign: 'center' },
    avatarSmall: {
        width: 28, height: 28, borderRadius: 14, backgroundColor: '#E9E3FF', alignItems: 'center', justifyContent: 'center',
    },
    avatarSmallText: { color: COLOR, fontSize: 10, fontWeight: '800' },
    username: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    usernameHighlight: { fontWeight: '800', color: COLOR },
    score: { fontSize: 14, fontWeight: '700', color: '#9BA1A6' },
    scoreHighlight: { color: COLOR },

    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    errorText: { color: '#EF4444', textAlign: 'center', fontWeight: '600' },
    emptyText: { color: '#6B7280', textAlign: 'center', fontWeight: '600' },
    singleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        marginBottom: 10,
    },
    singleMedal: { fontSize: 20 },
    singleAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E9E3FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    singleName: { fontSize: 14, fontWeight: '700', marginTop: 8, color: '#1A1A2E' },
    singleScore: { fontSize: 13, fontWeight: '700', marginTop: 4, color: COLOR },
    summaryWrap: { paddingHorizontal: 16, paddingTop: 12 },
    summaryCard: {
        backgroundColor: '#FCFAFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E8DFFF',
        shadowColor: '#6D5BBE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryTitle: { fontSize: 14, fontWeight: '800', color: '#5F46D5' },
    summaryBadge: {
        fontSize: 10,
        fontWeight: '800',
        color: '#5F46D5',
        backgroundColor: '#ECE6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    metricGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
    metricCard: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EFEAFF',
    },
    metricLabel: { fontSize: 10, color: '#7A7A93', fontWeight: '700', marginTop: 3 },
    metricValue: { fontSize: 12, color: '#1A1A2E', fontWeight: '800', marginTop: 2 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    progressLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
    progressValue: { fontSize: 11, color: '#5F46D5', fontWeight: '800' },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: '#ECE6FF',
        marginTop: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#7C5CFF',
        borderRadius: 999,
    },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#A78BFA';
const GOLD = '#FFD93D';
const SILVER = '#C0C0C0';
const BRONZE = '#CD7F32';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS = [
    { key: 'memory', label: 'Hafıza', icon: 'grid-outline' as IoniconsName },
    { key: '2048', label: '2048', icon: 'cube-outline' as IoniconsName },
    { key: 'sudoku', label: 'Sudoku', icon: 'apps-outline' as IoniconsName },
];

interface LeaderboardEntry {
    rank: number;
    username: string;
    score: string;
    avatar: string;
    isCurrentUser?: boolean;
}

const MOCK_DATA: Record<string, LeaderboardEntry[]> = {
    memory: [
        { rank: 1, username: 'AhmetY', score: '18s', avatar: '🧑‍💻' },
        { rank: 2, username: 'ElifK', score: '22s', avatar: '👩‍🎨' },
        { rank: 3, username: 'MertS', score: '25s', avatar: '🧑‍🚀' },
        { rank: 4, username: 'ZeynepA', score: '28s', avatar: '👩‍🔬' },
        { rank: 5, username: 'CanB', score: '31s', avatar: '🧑‍🎓' },
        { rank: 6, username: 'AyselS', score: '33s', avatar: '👩‍💼' },
        { rank: 7, username: 'BurakT', score: '35s', avatar: '🧑‍🍳' },
        { rank: 8, username: 'Sen', score: '38s', avatar: '⭐', isCurrentUser: true },
        { rank: 9, username: 'DenizR', score: '42s', avatar: '🧑‍🎤' },
        { rank: 10, username: 'SedaM', score: '45s', avatar: '👩‍⚕️' },
    ],
    '2048': [
        { rank: 1, username: 'MertS', score: '32768 — 4:12', avatar: '🧑‍🚀' },
        { rank: 2, username: 'ElifK', score: '24576 — 5:30', avatar: '👩‍🎨' },
        { rank: 3, username: 'AhmetY', score: '16384 — 3:45', avatar: '🧑‍💻' },
        { rank: 4, username: 'ZeynepA', score: '12288 — 6:10', avatar: '👩‍🔬' },
        { rank: 5, username: 'CanB', score: '8192 — 4:55', avatar: '🧑‍🎓' },
        { rank: 6, username: 'Sen', score: '4096 — 3:20', avatar: '⭐', isCurrentUser: true },
        { rank: 7, username: 'BurakT', score: '2048 — 2:45', avatar: '🧑‍🍳' },
        { rank: 8, username: 'AyselS', score: '2048 — 5:12', avatar: '👩‍💼' },
        { rank: 9, username: 'DenizR', score: '1024 — 3:08', avatar: '🧑‍🎤' },
        { rank: 10, username: 'SedaM', score: '512 — 1:45', avatar: '👩‍⚕️' },
    ],
    sudoku: [
        { rank: 1, username: 'MertS', score: '3:12', avatar: '🧑‍🚀' },
        { rank: 2, username: 'AhmetY', score: '3:45', avatar: '🧑‍💻' },
        { rank: 3, username: 'ZeynepA', score: '4:08', avatar: '👩‍🔬' },
        { rank: 4, username: 'ElifK', score: '4:22', avatar: '👩‍🎨' },
        { rank: 5, username: 'CanB', score: '4:55', avatar: '🧑‍🎓' },
        { rank: 6, username: 'Sen', score: '5:42', avatar: '⭐', isCurrentUser: true },
        { rank: 7, username: 'BurakT', score: '6:10', avatar: '🧑‍🍳' },
        { rank: 8, username: 'AyselS', score: '6:38', avatar: '👩‍💼' },
        { rank: 9, username: 'DenizR', score: '7:15', avatar: '🧑‍🎤' },
        { rank: 10, username: 'SedaM', score: '8:01', avatar: '👩‍⚕️' },
    ],
};

const getMedalColor = (rank: number) => {
    if (rank === 1) return GOLD;
    if (rank === 2) return SILVER;
    if (rank === 3) return BRONZE;
    return '#E0E0E0';
};

export default function LeaderboardScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('memory');

    const data = MOCK_DATA[activeTab] || [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🏆 Skor Tablosu</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? COLOR : 'rgba(255,255,255,0.6)'} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Podium */}
            <View style={styles.podium}>
                {/* 2nd place */}
                {data[1] && (
                    <View style={styles.podiumItem}>
                        <Text style={styles.podiumAvatar}>{data[1].avatar}</Text>
                        <View style={[styles.podiumBar, styles.podiumBar2]}>
                            <Text style={styles.podiumRank}>🥈</Text>
                        </View>
                        <Text style={styles.podiumName}>{data[1].username}</Text>
                        <Text style={styles.podiumScore}>{data[1].score}</Text>
                    </View>
                )}
                {/* 1st place */}
                {data[0] && (
                    <View style={styles.podiumItem}>
                        <Text style={[styles.podiumAvatar, { fontSize: 32 }]}>{data[0].avatar}</Text>
                        <View style={[styles.podiumBar, styles.podiumBar1]}>
                            <Text style={styles.podiumRank}>🥇</Text>
                        </View>
                        <Text style={[styles.podiumName, { fontWeight: '800' }]}>{data[0].username}</Text>
                        <Text style={[styles.podiumScore, { color: COLOR }]}>{data[0].score}</Text>
                    </View>
                )}
                {/* 3rd place */}
                {data[2] && (
                    <View style={styles.podiumItem}>
                        <Text style={styles.podiumAvatar}>{data[2].avatar}</Text>
                        <View style={[styles.podiumBar, styles.podiumBar3]}>
                            <Text style={styles.podiumRank}>🥉</Text>
                        </View>
                        <Text style={styles.podiumName}>{data[2].username}</Text>
                        <Text style={styles.podiumScore}>{data[2].score}</Text>
                    </View>
                )}
            </View>

            {/* Rest of leaderboard */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {data.slice(3).map((entry) => (
                    <View
                        key={entry.rank}
                        style={[styles.row, entry.isCurrentUser && styles.rowCurrentUser]}
                    >
                        <Text style={styles.rankText}>{entry.rank}</Text>
                        <Text style={styles.avatar}>{entry.avatar}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.username, entry.isCurrentUser && styles.usernameHighlight]}>
                                {entry.username}
                                {entry.isCurrentUser && ' (Sen)'}
                            </Text>
                        </View>
                        <Text style={[styles.score, entry.isCurrentUser && styles.scoreHighlight]}>
                            {entry.score}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        paddingBottom: 16, shadowColor: COLOR, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
        paddingHorizontal: 30, paddingTop: 20, gap: 12,
    },
    podiumItem: { alignItems: 'center', flex: 1 },
    podiumAvatar: { fontSize: 26, marginBottom: 6 },
    podiumBar: {
        width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12,
        alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8,
    },
    podiumBar1: { height: 80, backgroundColor: GOLD + '25' },
    podiumBar2: { height: 60, backgroundColor: SILVER + '25' },
    podiumBar3: { height: 44, backgroundColor: BRONZE + '25' },
    podiumRank: { fontSize: 20 },
    podiumName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginTop: 6 },
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
    avatar: { fontSize: 22 },
    username: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    usernameHighlight: { fontWeight: '800', color: COLOR },
    score: { fontSize: 14, fontWeight: '700', color: '#9BA1A6' },
    scoreHighlight: { color: COLOR },
});

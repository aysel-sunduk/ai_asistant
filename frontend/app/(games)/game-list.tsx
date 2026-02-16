import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#A78BFA';

const GAMES = [
    { id: '1', title: 'Hafıza Oyunu', desc: 'Kartları eşleştir', icon: 'grid-outline' as const, best: '32 sn', plays: 14 },
    { id: '2', title: 'Bilgi Yarışması', desc: '10 soruluk quiz', icon: 'help-circle-outline' as const, best: '8/10', plays: 7 },
    { id: '3', title: 'Sudoku', desc: 'Klasik bulmaca', icon: 'apps-outline' as const, best: '5:42', plays: 22 },
    { id: '4', title: 'Kelime Avı', desc: 'Kelimeleri bul', icon: 'text-outline' as const, best: '—', plays: 0 },
];

export default function GameListScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🎮 Oyunlar</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="trophy" size={20} color="#FFD93D" />
                        <Text style={styles.statNum}>43</Text>
                        <Text style={styles.statLabel}>Toplam Oynama</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Ionicons name="flame" size={20} color="#FF6B6B" />
                        <Text style={styles.statNum}>5</Text>
                        <Text style={styles.statLabel}>Gün Serisi</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {GAMES.map((g) => (
                    <TouchableOpacity key={g.id} style={styles.card} activeOpacity={0.7}>
                        <View style={styles.iconBox}>
                            <Ionicons name={g.icon} size={24} color={COLOR} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{g.title}</Text>
                            <Text style={styles.cardSub}>{g.desc}</Text>
                        </View>
                        <View style={styles.rightCol}>
                            <Text style={styles.bestLabel}>En iyi</Text>
                            <Text style={styles.bestVal}>{g.best}</Text>
                            <Text style={styles.playsText}>{g.plays} oynama</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

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
});

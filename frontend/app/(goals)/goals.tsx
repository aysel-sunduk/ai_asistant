import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#FFD93D';
const DARK = '#B8860B';

const GOALS = [
    { id: '1', title: 'Kitap okumak', target: '24 kitap', progress: 0.42, current: '10/24', icon: 'book-outline' as const },
    { id: '2', title: 'Spor yapmak', target: 'Haftada 4', progress: 0.75, current: '3/4', icon: 'barbell-outline' as const },
    { id: '3', title: 'Yeni dil öğrenmek', target: 'B2 seviye', progress: 0.30, current: 'A2', icon: 'language-outline' as const },
    { id: '4', title: 'Tasarruf', target: '₺50.000', progress: 0.60, current: '₺30.000', icon: 'wallet-outline' as const },
];

export default function GoalsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={DARK} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: DARK }]}>Hedefler</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="add" size={24} color={DARK} />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryNum}>4</Text>
                    <Text style={styles.summaryLabel}>aktif hedef</Text>
                    <View style={styles.overallBar}>
                        <View style={[styles.overallFill, { width: '52%' }]} />
                    </View>
                    <Text style={styles.overallText}>Genel ilerleme: %52</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {GOALS.map((g) => (
                    <View key={g.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox]}>
                                <Ionicons name={g.icon} size={20} color={DARK} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{g.title}</Text>
                                <Text style={styles.cardSub}>Hedef: {g.target}</Text>
                            </View>
                            <Text style={styles.currentText}>{g.current}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${g.progress * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>%{Math.round(g.progress * 100)} tamamlandı</Text>
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
        paddingBottom: 20, shadowColor: COLOR, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    summaryCard: { alignItems: 'center', marginTop: 12 },
    summaryNum: { fontSize: 36, fontWeight: '900', color: DARK },
    summaryLabel: { fontSize: 13, color: DARK + 'AA', marginTop: -2 },
    overallBar: { width: '70%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', marginTop: 12 },
    overallFill: { height: 6, borderRadius: 3, backgroundColor: DARK },
    overallText: { fontSize: 11, color: DARK + 'CC', marginTop: 6 },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLOR + '30', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    cardSub: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    currentText: { fontSize: 14, fontWeight: '700', color: DARK },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: '#F0F0F0', marginTop: 14 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: COLOR },
    progressText: { fontSize: 11, color: '#9BA1A6', marginTop: 6, textAlign: 'right' },
});

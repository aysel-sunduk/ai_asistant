import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#60A5FA';

const REMINDERS = [
    { id: '1', title: 'İlaç al', time: '08:00', repeat: 'Her gün', active: true, icon: 'medkit-outline' as const },
    { id: '2', title: 'Toplantı hatırlatma', time: '14:30', repeat: 'Bugün', active: true, icon: 'calendar-outline' as const },
    { id: '3', title: 'Egzersiz zamanı', time: '18:00', repeat: 'Haftaiçi', active: true, icon: 'barbell-outline' as const },
    { id: '4', title: 'Fatura ödeme', time: '10:00', repeat: '25 Şub', active: false, icon: 'card-outline' as const },
    { id: '5', title: 'Su iç', time: 'Her 2 saat', repeat: 'Her gün', active: true, icon: 'water-outline' as const },
];

export default function RemindersScreen() {
    const router = useRouter();
    const activeCount = REMINDERS.filter((r) => r.active).length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hatırlatıcılar</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Ionicons name="alarm" size={28} color="#fff" />
                    <View>
                        <Text style={styles.summaryNum}>{activeCount} aktif</Text>
                        <Text style={styles.summarySub}>{REMINDERS.length} hatırlatıcı</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {REMINDERS.map((r) => (
                    <View key={r.id} style={[styles.card, !r.active && styles.cardInactive]}>
                        <View style={[styles.iconBox, !r.active && { backgroundColor: '#E0E0E0' }]}>
                            <Ionicons name={r.icon} size={20} color={r.active ? COLOR : '#9BA1A6'} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, !r.active && { color: '#C4C4C4' }]}>{r.title}</Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="time-outline" size={12} color={r.active ? COLOR : '#C4C4C4'} />
                                <Text style={[styles.cardSub, !r.active && { color: '#D4D4D4' }]}>{r.time}</Text>
                                <Text style={styles.dot}>•</Text>
                                <Text style={[styles.cardSub, !r.active && { color: '#D4D4D4' }]}>{r.repeat}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusDot, { backgroundColor: r.active ? '#34D399' : '#E0E0E0' }]} />
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
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 28, marginTop: 16 },
    summaryNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
    summarySub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardInactive: { opacity: 0.6 },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLOR + '15', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    cardSub: { fontSize: 12, color: '#9BA1A6' },
    dot: { fontSize: 8, color: '#C4C4C4' },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
});

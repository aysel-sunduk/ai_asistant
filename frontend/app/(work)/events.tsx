import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#5B8DEF';

const MEETINGS = [
    { id: '1', title: 'Sprint Planning', time: '09:00', date: 'Bugün', attendees: 6, status: 'active' },
    { id: '2', title: 'Tasarım Review', time: '11:30', date: 'Bugün', attendees: 4, status: 'upcoming' },
    { id: '3', title: 'Müşteri Toplantısı', time: '14:00', date: 'Yarın', attendees: 3, status: 'upcoming' },
    { id: '4', title: 'Weekly Standup', time: '10:00', date: '19 Şub', attendees: 8, status: 'upcoming' },
];

const MAILS = [
    { id: '1', subject: 'Q1 Raporu', from: 'Mehmet K.', time: '2 saat önce', unread: true },
    { id: '2', subject: 'Proje Güncellemesi', from: 'Ayşe D.', time: '5 saat önce', unread: true },
    { id: '3', subject: 'Toplantı Notu', from: 'Ali V.', time: 'Dün', unread: false },
];

export default function EventsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>İş</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>4</Text>
                        <Text style={styles.statLabel}>Toplantı</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>2</Text>
                        <Text style={styles.statLabel}>Okunmamış</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>1</Text>
                        <Text style={styles.statLabel}>Aktif</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>📅 Toplantılar</Text>
                {MEETINGS.map((m) => (
                    <View key={m.id} style={styles.card}>
                        <View style={styles.cardLeft}>
                            <View style={[styles.dot, m.status === 'active' && { backgroundColor: '#34D399' }]} />
                            <View>
                                <Text style={styles.cardTitle}>{m.title}</Text>
                                <Text style={styles.cardSub}>{m.date} • {m.time}</Text>
                            </View>
                        </View>
                        <View style={styles.attendeeBadge}>
                            <Ionicons name="people" size={12} color={COLOR} />
                            <Text style={styles.attendeeText}>{m.attendees}</Text>
                        </View>
                    </View>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>✉️ E-postalar</Text>
                {MAILS.map((m) => (
                    <View key={m.id} style={styles.card}>
                        <View style={styles.cardLeft}>
                            {m.unread && <View style={styles.unreadDot} />}
                            <View>
                                <Text style={[styles.cardTitle, m.unread && { fontWeight: '800' }]}>{m.subject}</Text>
                                <Text style={styles.cardSub}>{m.from} • {m.time}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#C4C4C4" />
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
    statsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 20 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
    scroll: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLOR },
    cardTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    cardSub: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    attendeeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLOR + '12', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    attendeeText: { fontSize: 12, fontWeight: '700', color: COLOR },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#FF8A65';

const MEMBERS = [
    { id: '1', name: 'Ayşe Yıldız', role: 'Anne', avatar: 'AY', color: '#FF6B6B' },
    { id: '2', name: 'Mehmet Yıldız', role: 'Baba', avatar: 'MY', color: '#5B8DEF' },
    { id: '3', name: 'Elif Yıldız', role: 'Çocuk', avatar: 'EY', color: '#A78BFA' },
    { id: '4', name: 'Zeynep Yıldız', role: 'Çocuk', avatar: 'ZY', color: '#FFD93D' },
];

const EVENTS = [
    { id: '1', title: 'Aile Yemeği', date: '17 Şub, Pazar', icon: 'restaurant-outline' as const },
    { id: '2', title: 'Doğum Günü — Elif', date: '23 Şub, Cumartesi', icon: 'gift-outline' as const },
    { id: '3', title: 'Tatil Planı', date: '15 Mar', icon: 'airplane-outline' as const },
];

export default function ContactsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Aile</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersRow}>
                    {MEMBERS.map((m) => (
                        <View key={m.id} style={styles.memberCard}>
                            <View style={[styles.avatar, { backgroundColor: m.color }]}>
                                <Text style={styles.avatarText}>{m.avatar}</Text>
                            </View>
                            <Text style={styles.memberName}>{m.name.split(' ')[0]}</Text>
                            <Text style={styles.memberRole}>{m.role}</Text>
                        </View>
                    ))}
                    <View style={styles.addMember}>
                        <Ionicons name="add" size={24} color="rgba(255,255,255,0.6)" />
                    </View>
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>📌 Yaklaşan Etkinlikler</Text>
                {EVENTS.map((e) => (
                    <View key={e.id} style={styles.card}>
                        <View style={[styles.iconBox, { backgroundColor: COLOR + '15' }]}>
                            <Ionicons name={e.icon} size={20} color={COLOR} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{e.title}</Text>
                            <Text style={styles.cardSub}>{e.date}</Text>
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
    membersRow: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
    memberCard: { alignItems: 'center', width: 64 },
    avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    memberName: { fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 6 },
    memberRole: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
    addMember: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    cardSub: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
});

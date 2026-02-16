import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#F472B6';

const LISTS = [
    {
        id: '1', title: 'Market Listesi', count: 12, done: 8, icon: 'cart-outline' as const,
        items: ['Süt', 'Ekmek', 'Yumurta', 'Peynir'],
    },
    {
        id: '2', title: 'Teknoloji', count: 5, done: 1, icon: 'laptop-outline' as const,
        items: ['Kulaklık', 'Şarj kablosu', 'Mouse'],
    },
    {
        id: '3', title: 'Ev Dekorasyonu', count: 7, done: 3, icon: 'home-outline' as const,
        items: ['Perde', 'Yastık kılıfı'],
    },
];

export default function ListsScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Alışveriş</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>3</Text>
                        <Text style={styles.statLabel}>Liste</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>24</Text>
                        <Text style={styles.statLabel}>Ürün</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>12</Text>
                        <Text style={styles.statLabel}>Tamamlanan</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {LISTS.map((list) => (
                    <TouchableOpacity key={list.id} style={styles.card} activeOpacity={0.7}>
                        <View style={styles.cardTop}>
                            <View style={styles.iconBox}>
                                <Ionicons name={list.icon} size={22} color={COLOR} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{list.title}</Text>
                                <Text style={styles.cardSub}>{list.done}/{list.count} tamamlandı</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{list.count - list.done}</Text>
                            </View>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(list.done / list.count) * 100}%` }]} />
                        </View>
                        <View style={styles.itemsRow}>
                            {list.items.map((item, i) => (
                                <View key={i} style={styles.itemChip}>
                                    <Text style={styles.itemText}>{item}</Text>
                                </View>
                            ))}
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
    statsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 20 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLOR + '15', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    cardSub: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    badge: { backgroundColor: COLOR, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    progressBar: { height: 5, borderRadius: 3, backgroundColor: '#F0F0F0', marginTop: 14 },
    progressFill: { height: 5, borderRadius: 3, backgroundColor: COLOR },
    itemsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    itemChip: { backgroundColor: '#FDF2F8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    itemText: { fontSize: 11, fontWeight: '600', color: COLOR },
});

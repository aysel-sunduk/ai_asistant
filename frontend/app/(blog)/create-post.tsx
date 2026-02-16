import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#6C63FF';

const POSTS = [
    {
        id: '1', title: 'React Native ile Performans Optimizasyonu',
        summary: 'Uygulamanızı hızlandıracak 5 teknik: FlatList optimizasyonu, memo kullanımı...',
        date: '14 Şub 2026', readTime: '5 dk', category: 'Teknoloji',
    },
    {
        id: '2', title: 'Sağlıklı Beslenme Rehberi',
        summary: 'Günlük protein, karbonhidrat ve yağ ihtiyacınızı nasıl dengelersiniz?',
        date: '12 Şub 2026', readTime: '8 dk', category: 'Sağlık',
    },
    {
        id: '3', title: 'Finansal Okuryazarlık 101',
        summary: 'Birikim, yatırım ve bütçe yönetimi hakkında temel bilgiler...',
        date: '10 Şub 2026', readTime: '6 dk', category: 'Finans',
    },
    {
        id: '4', title: 'Verimlilik İçin 7 Alışkanlık',
        summary: 'Gününüzü daha verimli geçirmek için uygulayabileceğiniz pratik yöntemler.',
        date: '8 Şub 2026', readTime: '4 dk', category: 'Kişisel Gelişim',
    },
];

const CATEGORIES = ['Tümü', 'Teknoloji', 'Sağlık', 'Finans', 'Kişisel Gelişim'];

export default function BlogScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Blog</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="create-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                    {CATEGORIES.map((c, i) => (
                        <TouchableOpacity key={c} style={[styles.catChip, i === 0 && styles.catChipActive]}>
                            <Text style={[styles.catText, i === 0 && styles.catTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Featured */}
                <View style={styles.featuredCard}>
                    <View style={styles.featuredBadge}>
                        <Ionicons name="star" size={10} color="#fff" />
                        <Text style={styles.featuredBadgeText}>Öne Çıkan</Text>
                    </View>
                    <Text style={styles.featuredTitle}>{POSTS[0].title}</Text>
                    <Text style={styles.featuredSummary}>{POSTS[0].summary}</Text>
                    <View style={styles.featuredMeta}>
                        <Text style={styles.featuredDate}>{POSTS[0].date}</Text>
                        <Text style={styles.featuredRead}>📖 {POSTS[0].readTime}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Son Yazılar</Text>
                {POSTS.slice(1).map((p) => (
                    <TouchableOpacity key={p.id} style={styles.card} activeOpacity={0.7}>
                        <View style={styles.cardContent}>
                            <View style={styles.catLabel}>
                                <Text style={styles.catLabelText}>{p.category}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{p.title}</Text>
                            <Text style={styles.cardSummary} numberOfLines={2}>{p.summary}</Text>
                            <View style={styles.cardMeta}>
                                <Text style={styles.cardDate}>{p.date}</Text>
                                <Text style={styles.cardRead}>📖 {p.readTime}</Text>
                            </View>
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
        paddingBottom: 16, shadowColor: COLOR, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    catRow: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
    catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
    catChipActive: { backgroundColor: '#fff' },
    catText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
    catTextActive: { color: COLOR },
    scroll: { padding: 20, paddingBottom: 40 },
    featuredCard: {
        backgroundColor: COLOR, borderRadius: 20, padding: 22, marginBottom: 20,
        shadowColor: COLOR, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
    },
    featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    featuredBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    featuredTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 12 },
    featuredSummary: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginTop: 8 },
    featuredMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    featuredDate: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    featuredRead: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
    card: {
        backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardContent: { padding: 18 },
    catLabel: { backgroundColor: COLOR + '12', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    catLabelText: { fontSize: 10, fontWeight: '700', color: COLOR },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginTop: 8 },
    cardSummary: { fontSize: 13, color: '#9BA1A6', lineHeight: 18, marginTop: 6 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    cardDate: { fontSize: 11, color: '#C4C4C4' },
    cardRead: { fontSize: 11, color: '#C4C4C4' },
});

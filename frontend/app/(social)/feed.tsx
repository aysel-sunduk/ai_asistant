import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLOR = '#34D399';

const POSTS = [
    {
        id: '1', author: 'Mehmet K.', avatar: 'MK', avatarColor: '#5B8DEF', time: '2 saat önce',
        text: 'Bugün harika bir gün! Yeni projeye başladık 🚀',
        likes: 24, comments: 8,
    },
    {
        id: '2', author: 'Ayşe D.', avatar: 'AD', avatarColor: '#FF6B6B', time: '5 saat önce',
        text: 'İstanbul\'da güneşli bir gün ☀️ Herkes dışarı çıksın!',
        likes: 42, comments: 12,
    },
    {
        id: '3', author: 'Ali V.', avatar: 'AV', avatarColor: '#A78BFA', time: 'Dün',
        text: 'Yeni kitabımı bitirdim. Herkese tavsiye ederim: "Atomik Alışkanlıklar" 📚',
        likes: 18, comments: 5,
    },
];

export default function FeedScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sosyal</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="create-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Compose */}
                <View style={styles.composeCard}>
                    <View style={styles.composeAvatar}>
                        <Text style={styles.composeAvatarText}>SN</Text>
                    </View>
                    <Text style={styles.composePlaceholder}>Ne düşünüyorsun?</Text>
                </View>

                {POSTS.map((p) => (
                    <View key={p.id} style={styles.card}>
                        <View style={styles.postHeader}>
                            <View style={[styles.avatar, { backgroundColor: p.avatarColor }]}>
                                <Text style={styles.avatarText}>{p.avatar}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.author}>{p.author}</Text>
                                <Text style={styles.time}>{p.time}</Text>
                            </View>
                            <Ionicons name="ellipsis-horizontal" size={18} color="#C4C4C4" />
                        </View>
                        <Text style={styles.postText}>{p.text}</Text>
                        <View style={styles.postActions}>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="heart-outline" size={18} color="#FF6B6B" />
                                <Text style={styles.actionText}>{p.likes}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="chatbubble-outline" size={18} color={COLOR} />
                                <Text style={styles.actionText}>{p.comments}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Ionicons name="share-outline" size={18} color="#9BA1A6" />
                            </TouchableOpacity>
                        </View>
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
    scroll: { padding: 20, paddingBottom: 40 },
    composeCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    composeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLOR, alignItems: 'center', justifyContent: 'center' },
    composeAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    composePlaceholder: { fontSize: 14, color: '#C4C4C4' },
    card: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    author: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
    time: { fontSize: 11, color: '#9BA1A6', marginTop: 1 },
    postText: { fontSize: 14, color: '#333', lineHeight: 20, marginTop: 12 },
    postActions: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 13, fontWeight: '600', color: '#9BA1A6' },
});

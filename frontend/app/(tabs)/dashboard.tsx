import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

const SHORTCUTS = [
    { title: 'Finans', icon: 'wallet' as const, route: '/(tabs)/finance', color: '#4ECDC4' },
    { title: 'Sağlık', icon: 'heart' as const, route: '/(tabs)/health', color: '#FF6B6B' },
    { title: 'Blog', icon: 'book' as const, route: '/(tabs)/blog', color: '#6C63FF' },
];

export default function DashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user?.username || user?.email || 'Kullanıcı';

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış Yap',
                style: 'destructive',
                onPress: () => {
                    logout();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Karşılama */}
                <View style={styles.welcomeSection}>
                    <TouchableOpacity
                        style={styles.avatarCircle}
                        activeOpacity={0.7}
                        onPress={() => router.push('/(tabs)/profile')}
                    >
                        <Text style={styles.avatarText}>
                            {user?.firstName?.charAt(0) || 'K'}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.welcomeText}>
                        <Text style={styles.greeting}>Hoş geldin 👋</Text>
                        <Text style={styles.userName}>{displayName}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>

                {/* AI Öneri Kartı */}
                <View style={styles.aiCard}>
                    <View style={styles.aiCardHeader}>
                        <Ionicons name="sparkles" size={20} color="#fff" />
                        <Text style={styles.aiCardTitle}>AsistAI</Text>
                    </View>
                    <Text style={styles.aiCardText}>
                        Bugün için yapılacaklar listenizde 3 görev var. Hadi başlayalım!
                    </Text>
                </View>

                {/* Hızlı Erişim */}
                <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
                <View style={styles.shortcutsRow}>
                    {SHORTCUTS.map((item) => (
                        <TouchableOpacity
                            key={item.title}
                            style={styles.shortcutCard}
                            activeOpacity={0.7}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={[styles.shortcutIcon, { backgroundColor: item.color + '18' }]}>
                                <Ionicons name={item.icon} size={26} color={item.color} />
                            </View>
                            <Text style={styles.shortcutTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Son Aktiviteler */}
                <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
                <View style={styles.emptyCard}>
                    <Ionicons name="time-outline" size={40} color="#E0E0E0" />
                    <Text style={styles.emptyText}>Henüz aktivite yok</Text>
                    <Text style={styles.emptySubtext}>
                        Modülleri kullanmaya başladığınızda burada görünecek
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 44,
        paddingBottom: 30,
    },

    /* Karşılama */
    welcomeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },
    avatarCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    welcomeText: {
        flex: 1,
    },
    logoutButton: {
        padding: 8,
    },
    greeting: {
        fontSize: 15,
        color: GRAY,
    },
    userName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A2E',
        marginTop: 2,
    },

    /* AI Kart */
    aiCard: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    aiCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    aiCardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    aiCardText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        lineHeight: 20,
    },

    /* Bölüm Başlığı */
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 16,
    },

    /* Hızlı Erişim */
    shortcutsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    shortcutCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 10,
    },
    shortcutIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shortcutTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A2E',
    },

    /* Boş Durum */
    emptyCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        padding: 32,
        alignItems: 'center',
        gap: 8,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    emptySubtext: {
        fontSize: 13,
        color: GRAY,
        textAlign: 'center',
    },
});

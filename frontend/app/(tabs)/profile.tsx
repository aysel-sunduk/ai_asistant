// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
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
import { blogApi } from '../../src/api/blog.api';
import { socialApi } from '../../src/api/social.api';
import { userApi } from '../../src/api/user.api';
import { useAuthStore } from '../../src/store/auth.store';

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#8B83FF';
const GRAY = '#9BA1A6';
const BORDER = '#F0F0F0';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
    icon: IoniconsName;
    label: string;
    subtitle?: string;
    color?: string;
    onPress?: () => void;
    isDestructive?: boolean;
}

export default function ProfileScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const profile = useAuthStore((s) => s.profile);
    const logout = useAuthStore((s) => s.logout);
    const setUser = useAuthStore((s) => s.setUser);

    const [stats, setStats] = React.useState({ followers: 0, following: 0, posts: 0 });

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await userApi.getMe();
                setUser(res.data.data);
            } catch (err) {
                console.log('[Profile] Failed to fetch user details:', err);
            }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            try {
                const [socialRes, blogRes] = await Promise.all([
                    socialApi.getStats(),
                    blogApi.getUserVisiblePosts(user.id, 0, 1)
                ]);
                setStats({
                    followers: socialRes.data?.data?.followersCount || 0,
                    following: socialRes.data?.data?.followingCount || 0,
                    posts: blogRes.data?.data?.totalElements || 0,
                });
            } catch (err) {
                console.log('[Profile] Failed to fetch stats:', err);
            }
        };
        fetchStats();
    }, [user?.id]);

    const displayName = profile?.fullName
        ? profile.fullName
        : profile?.firstName
            ? `${profile.firstName} ${profile.lastName || ''}`.trim()
            : user?.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : user?.username || user?.email || 'Kullanıcı';

    const initials = profile?.firstName
        ? `${profile.firstName.charAt(0)}${profile.lastName?.charAt(0) || ''}`.toUpperCase()
        : user?.firstName
            ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}`.toUpperCase()
            : user?.email?.charAt(0).toUpperCase() || 'K';

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

    const accountItems: MenuItem[] = [
        {
            icon: 'person-outline',
            label: 'Kişisel Bilgiler',
            subtitle: 'Ad, soyad, telefon',
            color: PURPLE,
            onPress: () => router.push('/personal-info'),
        },
        {
            icon: 'shield-checkmark-outline',
            label: 'Şifre Değiştir',
            subtitle: 'Hesap güvenliği ve şifre güncelleme',
            color: '#4ECDC4',
            onPress: () => router.push('/change-password'),
        },
        {
            icon: 'heart-outline',
            label: 'Sağlık Bilgileri',
            subtitle: 'Boy, kilo, hareket durumu',
            color: '#FF6B6B',
            onPress: () => router.push('/health-info'),
        },
    ];

    const appItems: MenuItem[] = [
        {
            icon: 'color-palette-outline',
            label: 'Görünüm',
            subtitle: 'Tema, yazı boyutu',
            color: '#FF6B6B',
        },
        {
            icon: 'information-circle-outline',
            label: 'Hakkında',
            subtitle: 'Uygulama Bilgileri',
            color: '#4ECDC4',
            onPress: () => router.push('/about'),
        },
    ];

    const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
        <TouchableOpacity
            key={index}
            style={[styles.menuItem, !isLast && styles.menuItemBorder]}
            activeOpacity={0.6}
            onPress={item.onPress}
        >
            <View style={[styles.menuIconCircle, { backgroundColor: (item.color || PURPLE) + '15' }]}>
                <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.isDestructive ? '#FF6B6B' : item.color || PURPLE}
                />
            </View>
            <View style={styles.menuTextGroup}>
                <Text style={[styles.menuLabel, item.isDestructive && styles.destructiveText]}>
                    {item.label}
                </Text>
                {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D0D0D0" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Profil Header */}
                <View style={styles.headerGradient}>
                    <View style={styles.headerContent}>
                        <View style={styles.avatarOuter}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </View>
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={12} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.displayName}>{displayName}</Text>
                        <Text style={styles.email}>{user?.email || ''}</Text>

                        {/* İstatistikler */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.followers}</Text>
                                <Text style={styles.statLabel}>Takipçi</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.following}</Text>
                                <Text style={styles.statLabel}>Takip Edilen</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.posts}</Text>
                                <Text style={styles.statLabel}>Blog Yazısı</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menü Bölümü - Hesap */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Hesap</Text>
                    <View style={styles.menuCard}>
                        {accountItems.map((item, i) =>
                            renderMenuItem(item, i, i === accountItems.length - 1),
                        )}
                    </View>
                </View>

                {/* Menü Bölümü - Uygulama */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Uygulama</Text>
                    <View style={styles.menuCard}>
                        {appItems.map((item, i) =>
                            renderMenuItem(item, i, i === appItems.length - 1),
                        )}
                    </View>
                </View>

                {/* Çıkış Butonu */}
                <View style={styles.menuSection}>
                    <View style={styles.menuCard}>
                        {renderMenuItem(
                            {
                                icon: 'log-out-outline',
                                label: 'Çıkış Yap',
                                color: '#FF6B6B',
                                isDestructive: true,
                                onPress: handleLogout,
                            },
                            0,
                            true,
                        )}
                    </View>
                </View>

                <Text style={styles.versionText}>AsistAI v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    /* ─── Header ─── */
    headerGradient: {
        backgroundColor: PURPLE,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 72 : 52,
        paddingBottom: 28,
        paddingHorizontal: 24,
    },

    /* Avatar */
    avatarOuter: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '700',
    },
    editBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: PURPLE_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: PURPLE,
    },

    /* İsim & Email */
    displayName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 20,
    },

    /* İstatistikler */
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 8,
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    /* ─── Menü ─── */
    menuSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: GRAY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginLeft: 4,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    menuIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    menuTextGroup: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    menuSubtitle: {
        fontSize: 12,
        color: GRAY,
        marginTop: 2,
    },
    destructiveText: {
        color: '#FF6B6B',
    },

    /* ─── Alt ─── */
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#C4C4C4',
        marginTop: 28,
        marginBottom: 36,
    },
});

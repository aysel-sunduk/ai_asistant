// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { googleCalendarService } from '../../services/google-calendar.service';
import { userService } from '../../services/user.service';
import { blogApi } from '../../src/api/blog.api';
import { API_BASE_URL } from '../../src/api/client';
import { socialApi } from '../../src/api/social.api';
import { userApi } from '../../src/api/user.api';
import { useAuthStore } from '../../src/store/auth.store';

import { useColorScheme } from '../../hooks/use-color-scheme';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';

import { getNotificationPermissionStatus, requestNotificationPermission } from '../../src/hooks/usePushNotifications';


const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = API_BASE_URL;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

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
    const setProfile = useAuthStore((s) => s.setProfile);
    const themeMode = useThemeStore((s) => s.mode);
    const setThemeMode = useThemeStore((s) => s.setMode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(themeMode, systemScheme) === 'dark';

    const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const [calendarStatus, setCalendarStatus] = useState<{ connected: boolean; email?: string } | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [notifStatus, setNotifStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
    const [themeModalVisible, setThemeModalVisible] = useState(false);
    const { code } = useLocalSearchParams<{ code?: string }>();

    const fetchStatusAndStats = useCallback(async () => {
        try {
            const res = await userApi.getMe();
            const profileRes = await userService.getProfile();
            setUser(res.data.data);
            if (setProfile) setProfile(profileRes);

            const [socialRes, blogRes, calendarRes, permStatus] = await Promise.all([
                socialApi.getStats(),
                blogApi.getUserVisiblePosts(res.data.data.id, 0, 1),
                googleCalendarService.getStatus().catch(() => ({ connected: false })),
                getNotificationPermissionStatus(),
            ]);
            
            setStats({
                followers: socialRes.data?.data?.followersCount || 0,
                following: socialRes.data?.data?.followingCount || 0,
                posts: blogRes.data?.data?.totalElements || 0,
            });
            setCalendarStatus(calendarRes);
            setNotifStatus(permStatus);

            // Eğer izin zaten verilmişse, token'ı sessizce guncelle
            if (permStatus === 'granted') {
                try {
                    const pushUtils = require('../../src/hooks/usePushNotifications');
                    const func = pushUtils.registerAndSendToken;
                    if (typeof func === 'function') {
                        func().catch(() => {});
                    } else if (pushUtils.default && typeof pushUtils.default.registerAndSendToken === 'function') {
                        pushUtils.default.registerAndSendToken().catch(() => {});
                    }
                } catch (e) {
                    console.log('[Profile] Notification registration error:', e);
                }
            }
        } catch (err) {
            console.log('[Profile] Failed to fetch data:', err);
        }
    }, [setUser, setProfile]);

    useEffect(() => {
        fetchStatusAndStats();
    }, [fetchStatusAndStats]);

    // Handle OAuth Callback
    useEffect(() => {
        if (code && !isConnecting) {
            const connectCalendar = async () => {
                setIsConnecting(true);
                try {
                    const redirectUri = Linking.createURL('/profile');
                    await googleCalendarService.connect(code, redirectUri);
                    Alert.alert('Başarılı', 'Google Takvim başarıyla bağlandı!');
                    // Clear the code from URL if possible, or just refresh status
                    await fetchStatusAndStats();
                } catch (err) {
                    Alert.alert('Hata', 'Bağlantı kurulamadı.');
                } finally {
                    setIsConnecting(false);
                }
            };
            connectCalendar();
        }
    }, [code]);

    const handlePickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Image picker error:', error);
            Alert.alert('Hata', 'Görsel seçilemedi.');
        }
    };

    const uploadImage = async (uri: string) => {
        setIsUploadingPicture(true);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename.toLowerCase());
            let type = match ? `image/${match[1]}` : `image/jpeg`;
            if (type === 'image/jpg') type = 'image/jpeg';

            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type,
            } as any);

            const updatedProfile = await userService.uploadProfilePicture(formData);
            if (setProfile) setProfile(updatedProfile);
            Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi');
        } catch (error) {
            console.log('Upload picture error:', error);
            Alert.alert('Hata', 'Profil fotoğrafı yüklenemedi.');
        } finally {
            setIsUploadingPicture(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            try {
                const [socialRes, blogRes, calendarRes] = await Promise.all([
                    socialApi.getStats(),
                    blogApi.getUserVisiblePosts(user.id, 0, 1),
                    googleCalendarService.getStatus().catch(() => ({ connected: false }))
                ]);
                setStats({
                    followers: socialRes.data?.data?.followersCount || 0,
                    following: socialRes.data?.data?.followingCount || 0,
                    posts: blogRes.data?.data?.totalElements || 0,
                });
                setCalendarStatus(calendarRes);
            } catch (err) {
                console.log('[Profile] Failed to fetch stats/calendar:', err);
            }
        };
        fetchStats();
    }, [user?.id]);

    const handleGoogleCalendar = async () => {
        if (calendarStatus?.connected) {
            Alert.alert('Bağlantıyı Kes', 'Google Takvim bağlantısını kesmek istediğinize emin misiniz?', [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Bağlantıyı Kes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await googleCalendarService.disconnect();
                            setCalendarStatus({ connected: false });
                            Alert.alert('Başarılı', 'Bağlantı kesildi.');
                        } catch (err) {
                            Alert.alert('Hata', 'Bağlantı kesilemedi.');
                        }
                    }
                }
            ]);
        } else {
            try {
                // In a real app, redirectUri should be your deep link scheme or a specific web route
                const redirectUri = Linking.createURL('/profile');
                const { authUrl } = await googleCalendarService.getAuthUrl(redirectUri);
                // Redirect user to browser for OAuth
                await Linking.openURL(authUrl);
            } catch (err) {
                Alert.alert('Hata', 'Bağlantı penceresi açılamadı.');
            }
        }
    };

    const handleNotificationToggle = async () => {
        if (notifStatus === 'granted') {
            Alert.alert(
                'Bildirimler Açık',
                'Bildirimleri kapatmak için uygulama ayarlarına gidin.',
                [
                    { text: 'Tamam', style: 'cancel' },
                    { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                ],
            );
        } else {
            const granted = await requestNotificationPermission();
            if (granted) {
                setNotifStatus('granted');
                // Token gönderimi requestNotificationPermission içinde registerAndSendToken ile yapılıyor
            }
        }
    };

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

    const themeSubtitle = themeMode === 'dark' ? 'Koyu mod'
        : themeMode === 'light' ? 'Açık mod'
            : 'Sistem';

    const handleThemeSelect = () => {
        setThemeModalVisible(true);
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
            icon: 'notifications-outline',
            label: 'Bildirimler',
            subtitle: notifStatus === 'granted' ? 'Açık ✅' : 'Kapalı — Açmak için tıklayın',
            color: '#FF9500',
            onPress: handleNotificationToggle,
        },
        {
            icon: 'logo-google',
            label: 'Google Takvim',
            subtitle: calendarStatus?.connected ? `Bağlı: ${calendarStatus.email || 'Aktif'}` : 'Henüz bağlanmadı',
            color: '#4285F4',
            onPress: handleGoogleCalendar,
        },
        {
            icon: 'color-palette-outline',
            label: 'Görünüm',
            subtitle: themeSubtitle,
            color: '#FF6B6B',
            onPress: handleThemeSelect,
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
            style={[
                styles.menuItem,
                !isLast && styles.menuItemBorder,
                isDark && styles.menuItemDark,
                isDark && !isLast && styles.menuItemBorderDark,
            ]}
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
                <Text style={[styles.menuLabel, isDark && styles.menuLabelDark, item.isDestructive && styles.destructiveText]}>
                    {item.label}
                </Text>
                {item.subtitle && <Text style={[styles.menuSubtitle, isDark && styles.menuSubtitleDark]}>{item.subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D0D0D0" />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Profil Header */}
                <View style={styles.headerGradient}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.avatarOuter} onPress={handlePickImage} disabled={isUploadingPicture}>
                            <View style={styles.avatarCircle}>
                                {isUploadingPicture ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : profile?.profilePictureUrl ? (
                                    <Image 
                                        source={{ uri: getImageUrl(profile.profilePictureUrl) as string }} 
                                        style={{ width: 88, height: 88, borderRadius: 44 }} 
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>{initials}</Text>
                                )}
                            </View>
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={12} color="#fff" />
                            </View>
                        </TouchableOpacity>
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
                    <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Hesap</Text>
                    <View style={[styles.menuCard, isDark && styles.menuCardDark]}>
                        {accountItems.map((item, i) =>
                            renderMenuItem(item, i, i === accountItems.length - 1),
                        )}
                    </View>
                </View>

                {/* Menü Bölümü - Uygulama */}
                <View style={styles.menuSection}>
                    <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Uygulama</Text>
                    <View style={[styles.menuCard, isDark && styles.menuCardDark]}>
                        {appItems.map((item, i) =>
                            renderMenuItem(item, i, i === appItems.length - 1),
                        )}
                    </View>
                </View>

                {/* Çıkış Butonu */}
                <View style={styles.menuSection}>
                    <View style={[styles.menuCard, isDark && styles.menuCardDark]}>
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

                <Text style={[styles.versionText, isDark && styles.versionTextDark]}>AsistAI v1.0.0</Text>
            </ScrollView>

            {/* Tema Secim Modali */}
            <Modal visible={themeModalVisible} transparent animationType="fade" onRequestClose={() => setThemeModalVisible(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setThemeModalVisible(false)}>
                    <Pressable style={[styles.modalCard, isDark && styles.modalCardDark]} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Görünüm</Text>
                                <Text style={[styles.modalSub, isDark && styles.modalSubDark]}>Uygulama temasını seçin</Text>
                            </View>
                            <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                                <Ionicons name="close" size={22} color={isDark ? '#94A3B8' : '#64748B'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.themeOptions}>
                            {[
                                { id: 'light', label: 'Açık', icon: 'sunny-outline', color: '#FF9500' },
                                { id: 'dark', label: 'Koyu', icon: 'moon-outline', color: '#6C63FF' },
                                { id: 'system', label: 'SistemVarsayılanı', icon: 'settings-outline', color: '#8E8E93' },
                            ].map((opt) => {
                                const isSelected = themeMode === opt.id;
                                return (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.themeOption,
                                            isDark && styles.themeOptionDark,
                                            isSelected && styles.themeOptionSelected,
                                            isDark && isSelected && styles.themeOptionSelectedDark,
                                        ]}
                                        onPress={() => {
                                            void setThemeMode(opt.id as any);
                                        }}
                                    >
                                        <View style={[styles.optionIconBox, { backgroundColor: opt.color + '15' }]}>
                                            <Ionicons name={opt.icon as any} size={20} color={isSelected ? PURPLE : opt.color} />
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isDark && styles.optionTextDark,
                                            isSelected && styles.optionTextSelected,
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    containerDark: {
        backgroundColor: '#0B1220',
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
    sectionTitleDark: {
        color: '#94A3B8',
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
    menuCardDark: {
        backgroundColor: '#111827',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemDark: {
        backgroundColor: '#111827',
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    menuItemBorderDark: {
        borderBottomColor: '#1F2937',
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
    menuLabelDark: {
        color: '#E5E7EB',
    },
    menuSubtitle: {
        fontSize: 12,
        color: GRAY,
        marginTop: 2,
    },
    menuSubtitleDark: {
        color: '#9CA3AF',
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
    versionTextDark: {
        color: '#6B7280',
    },
    /* ─── Modal Styles ─── */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalCardDark: {
        backgroundColor: '#1E293B',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
    },
    modalTitleDark: {
        color: '#F8FAFC',
    },
    modalSub: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    modalSubDark: {
        color: '#94A3B8',
    },
    themeOptions: {
        gap: 12,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    themeOptionDark: {
        backgroundColor: '#0F172A',
    },
    themeOptionSelected: {
        borderColor: PURPLE,
        backgroundColor: '#F5F3FF',
    },
    themeOptionSelectedDark: {
        borderColor: PURPLE,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
    },
    optionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
    },
    optionTextDark: {
        color: '#CBD5E1',
    },
    optionTextSelected: {
        color: PURPLE,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: PURPLE,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PURPLE,
    },
});

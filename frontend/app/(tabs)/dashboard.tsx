import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
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
import { remindersService } from '../../services/reminders.service';
import { socialService } from '../../services/social.service';
import { userApi } from '../../src/api/user.api';
import type { Reminder } from '../../src/models/reminder.model';
import type { FollowRequestItem } from '../../src/models/social.model';
import { useAuthStore } from '../../src/store/auth.store';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

const SHORTCUTS = [
    { title: 'Finans', icon: 'wallet' as const, route: '/(tabs)/finance', color: '#4ECDC4' },
    { title: 'Saglik', icon: 'heart' as const, route: '/(tabs)/health', color: '#FF6B6B' },
    { title: 'Blog', icon: 'book' as const, route: '/(tabs)/blog', color: '#6C63FF' },
];

export default function DashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const profile = useAuthStore((s) => s.profile);
    const setProfile = useAuthStore((s) => s.setProfile);
    const logout = useAuthStore((s) => s.logout);
    const displayName = profile?.fullName?.trim()
        || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
        || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '')
        || user?.username
        || user?.email
        || 'Kullanici';

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [incomingFollowRequests, setIncomingFollowRequests] = useState<FollowRequestItem[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [requestActionUserId, setRequestActionUserId] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            const res = await userApi.getProfile();
            if (res.data?.data) {
                setProfile(res.data.data);
            }
        } catch {
            // Silent fallback: store'daki mevcut user/profile ile devam et
        }
    }, [setProfile]);

    const loadNotifications = useCallback(async () => {
        setNotificationsLoading(true);
        try {
            const [reminderItems, requestsPage] = await Promise.all([
                remindersService.getNotifications(1440),
                socialService.getIncomingRequests(0, 20),
            ]);
            setReminders(reminderItems || []);
            setIncomingFollowRequests(requestsPage.content || []);
        } catch {
            setReminders([]);
            setIncomingFollowRequests([]);
        } finally {
            setNotificationsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadProfile();
            void loadNotifications();
        }, [loadNotifications, loadProfile]),
    );

    const pendingReminders = useMemo(
        () => [...reminders].sort((a, b) => +new Date(a.remindAt) - +new Date(b.remindAt)),
        [reminders],
    );
    const totalNotificationCount = pendingReminders.length + incomingFollowRequests.length;

    const dismissNotification = async (id: string) => {
        await remindersService.dismissNotification(id);
        await loadNotifications();
    };

    const clearAllNotifications = async () => {
        await remindersService.clearNotifications(1440);
        await loadNotifications();
    };

    const respondFollowRequest = async (requesterUserId: string, action: 'accept' | 'reject') => {
        setRequestActionUserId(requesterUserId);
        try {
            if (action === 'accept') {
                await socialService.acceptRequest(requesterUserId);
            } else {
                await socialService.rejectRequest(requesterUserId);
            }
            await loadNotifications();
        } catch (error: any) {
            Alert.alert('Hata', error?.response?.data?.message || 'Takip istegi guncellenemedi.');
        } finally {
            setRequestActionUserId(null);
        }
    };

    const handleLogout = () => {
        Alert.alert('Cikis Yap', 'Cikis yapmak istediginize emin misiniz?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Cikis Yap',
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
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeSection}>
                    <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile')}>
                        <Text style={styles.avatarText}>
                            {(profile?.firstName?.charAt(0) || user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'K').toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.welcomeText}>
                        <Text style={styles.greeting}>Hos geldin</Text>
                        <Text style={styles.userName}>{displayName}</Text>
                    </View>
                    <View style={styles.topActions}>
                        <TouchableOpacity onPress={() => setNotificationsOpen(true)} style={styles.notifyButton}>
                            <Ionicons name="notifications-outline" size={22} color={PURPLE} />
                            {totalNotificationCount > 0 && (
                                <View style={styles.notifyBadge}>
                                    <Text style={styles.notifyBadgeText}>
                                        {totalNotificationCount > 9 ? '9+' : totalNotificationCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.aiCard}>
                    <View style={styles.aiCardHeader}>
                        <Ionicons name="sparkles" size={20} color="#fff" />
                        <Text style={styles.aiCardTitle}>AsistAI</Text>
                    </View>
                    <Text style={styles.aiCardText}>
                        Yaklasan hatirlaticilarin ve modullerden son hareketlerin burada gorunur.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Hizli Erisim</Text>
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

                <Text style={styles.sectionTitle}>Yaklasan Hatirlaticilar</Text>
                {pendingReminders.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="time-outline" size={34} color="#E0E0E0" />
                        <Text style={styles.emptyText}>Planli hatirlatici yok</Text>
                    </View>
                ) : (
                    pendingReminders.slice(0, 3).map((r) => (
                        <TouchableOpacity key={r.id} style={styles.reminderCard} onPress={() => router.push('/(reminders)/reminders')}>
                            <Ionicons name="alarm-outline" size={18} color={PURPLE} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.reminderTitle}>{r.title}</Text>
                                <Text style={styles.reminderTime}>
                                    {new Date(r.remindAt).toLocaleString('tr-TR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <Modal visible={notificationsOpen} transparent animationType="fade" onRequestClose={() => setNotificationsOpen(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setNotificationsOpen(false)}>
                    <Pressable style={styles.modalCard} onPress={() => undefined}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bildirimler</Text>
                            <TouchableOpacity onPress={() => setNotificationsOpen(false)}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {notificationsLoading ? (
                            <View style={styles.modalLoadingWrap}>
                                <ActivityIndicator size="small" color={PURPLE} />
                            </View>
                        ) : totalNotificationCount === 0 ? (
                            <Text style={styles.modalEmpty}>Yeni bildirim yok.</Text>
                        ) : (
                            <View>
                                {incomingFollowRequests.length > 0 && (
                                    <View style={styles.notificationSection}>
                                        <Text style={styles.notificationSectionTitle}>Takip Istekleri</Text>
                                        {incomingFollowRequests.slice(0, 4).map((req) => (
                                            <View key={req.user.userId} style={styles.notificationItem}>
                                                <Ionicons name="person-add-outline" size={16} color="#10B981" />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.notificationTitle}>
                                                        {`${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email}
                                                    </Text>
                                                    <Text style={styles.notificationSub}>Seni takip etmek istiyor</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.requestAcceptBtn}
                                                    disabled={requestActionUserId === req.user.userId}
                                                    onPress={() => respondFollowRequest(req.user.userId, 'accept')}
                                                >
                                                    <Ionicons name="checkmark" size={14} color="#15803D" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.requestRejectBtn}
                                                    disabled={requestActionUserId === req.user.userId}
                                                    onPress={() => respondFollowRequest(req.user.userId, 'reject')}
                                                >
                                                    <Ionicons name="close" size={14} color="#B91C1C" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {pendingReminders.length > 0 && (
                                    <View style={styles.notificationSection}>
                                        <Text style={styles.notificationSectionTitle}>Yaklasan Hatirlaticilar</Text>
                                        {pendingReminders.slice(0, 8).map((r) => (
                                            <View key={r.id} style={styles.notificationItem}>
                                                <Ionicons name="alarm-outline" size={16} color={PURPLE} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.notificationTitle}>{r.title}</Text>
                                                    <Text style={styles.notificationSub}>
                                                        {new Date(r.remindAt).toLocaleString('tr-TR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity style={styles.notificationDeleteBtn} onPress={() => dismissNotification(r.id)}>
                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity style={styles.modalActionGhost} onPress={clearAllNotifications}>
                                <Text style={styles.modalActionGhostText}>Hepsini Temizle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalAction}
                                onPress={() => {
                                    setNotificationsOpen(false);
                                    router.push('/(reminders)/reminders');
                                }}
                            >
                                <Text style={styles.modalActionText}>Tumunu Gor</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 44,
        paddingBottom: 30,
    },
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
    avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
    welcomeText: { flex: 1 },
    greeting: { fontSize: 15, color: GRAY },
    userName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginTop: 2 },
    topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    logoutButton: { padding: 8 },
    notifyButton: {
        width: 36,
        height: 36,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        marginRight: 6,
        position: 'relative',
    },
    notifyBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 16,
        height: 16,
        borderRadius: 999,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    notifyBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    aiCard: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        padding: 20,
        marginBottom: 28,
    },
    aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    aiCardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    aiCardText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
    shortcutsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    shortcutCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 10,
    },
    shortcutIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    shortcutTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
    emptyCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    emptyText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
    reminderCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ECEFF3',
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reminderTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    reminderTime: { fontSize: 12, color: '#64748B', marginTop: 2 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.35)',
        justifyContent: 'flex-start',
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingHorizontal: 16,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    modalTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
    modalEmpty: { color: '#64748B', fontSize: 13, paddingVertical: 8 },
    modalLoadingWrap: { paddingVertical: 18, alignItems: 'center' },
    notificationSection: { marginBottom: 6 },
    notificationSectionTitle: { fontSize: 12, fontWeight: '800', color: '#475569', marginTop: 6, marginBottom: 4 },
    notificationItem: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    notificationDeleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
    },
    requestAcceptBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCFCE7',
    },
    requestRejectBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
    },
    notificationTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    notificationSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    modalActionsRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
    modalActionGhost: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#fff',
    },
    modalActionGhostText: { color: '#334155', fontSize: 13, fontWeight: '800' },
    modalAction: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: PURPLE,
    },
    modalActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});

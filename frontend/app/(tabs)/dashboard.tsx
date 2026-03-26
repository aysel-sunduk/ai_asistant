// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
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
    Image,
} from 'react-native';
import { API_BASE_URL } from '../../src/api/client';
import { familyService } from '../../services/family.service';
import { remindersService } from '../../services/reminders.service';
import { socialService } from '../../services/social.service';
import { userApi } from '../../src/api/user.api';
import type { FamilyFinanceReportResponse } from '../../src/models/family.model';
import type { Reminder } from '../../src/models/reminder.model';
import type { FollowRequestItem } from '../../src/models/social.model';
import { useAuthStore } from '../../src/store/auth.store';
import { useMenuStore } from '../../src/store/menu.store';
import { sendTestNotification } from '../../src/hooks/usePushNotifications';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = API_BASE_URL;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function DashboardScreen() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const profile = useAuthStore((s) => s.profile);
    const setProfile = useAuthStore((s) => s.setProfile);
    const logout = useAuthStore((s) => s.logout);
    const menuModules = useMenuStore((s) => s.modules);
    const shortcutsIds = useMenuStore((s) => s.shortcuts);
    const toggleShortcut = useMenuStore((s) => s.toggleShortcut);
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const shortcuts = useMemo(() => {
        const safeShortcutIds = shortcutsIds || [];
        const safeModules = menuModules || [];
        return safeShortcutIds
            .map((id) => safeModules.find((m) => m.id === id))
            .filter(Boolean) as typeof safeModules;
    }, [shortcutsIds, menuModules]);

    const displayName = profile?.fullName?.trim()
        || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
        || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '')
        || user?.username
        || user?.email
        || 'Kullanici';

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [incomingFollowRequests, setIncomingFollowRequests] = useState<FollowRequestItem[]>([]);
    const [financeReport, setFinanceReport] = useState<FamilyFinanceReportResponse | null>(null);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [requestActionUserId, setRequestActionUserId] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            const res = await userApi.getProfile();
            if (res.data?.data) {
                setProfile(res.data.data);
            }
        } catch {
            // Silent fallback
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

    const loadFinanceSnapshot = useCallback(async () => {
        try {
            const report = await familyService.getTransactionsReport('MONTHLY');
            setFinanceReport(report);
        } catch {
            setFinanceReport(null);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadProfile();
            void loadNotifications();
            void loadFinanceSnapshot();
        }, [loadNotifications, loadProfile, loadFinanceSnapshot]),
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

    const handleToggleShortcut = (id: string) => {
        const safeShortcutIds = shortcutsIds || [];
        if (!safeShortcutIds.includes(id) && safeShortcutIds.length >= 3) {
            Alert.alert('Limit Dolu', 'Anasayfaya en fazla 3 hizli erisim ekleyebilirsiniz.');
            return;
        }
        toggleShortcut(id);
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0B1220' : '#fff'} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeSection}>
                    <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile')}>
                        {profile?.profilePictureUrl ? (
                            <Image
                                source={{ uri: getImageUrl(profile.profilePictureUrl) as string }}
                                style={{ width: 52, height: 52, borderRadius: 26 }}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {(profile?.firstName?.charAt(0) || user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'K').toUpperCase()}
                            </Text>
                        )}
                    </TouchableOpacity>
                    <View style={styles.welcomeText}>
                        <Text style={[styles.greeting, isDark && styles.greetingDark]}>Hos geldin</Text>
                        <Text style={[styles.userName, isDark && styles.userNameDark]}>{displayName}</Text>
                    </View>
                    <View style={styles.topActions}>
                        <TouchableOpacity onPress={() => setNotificationsOpen(true)} style={[styles.notifyButton, isDark && styles.notifyButtonDark]}>
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

                {financeReport && (
                    <View style={[styles.financeCard, isDark && styles.financeCardDark]}>
                        <View style={styles.financeHeader}>
                            <Text style={[styles.financeTitle, isDark && styles.financeTitleDark]}>Aylik Gelir/Gider</Text>
                            <TouchableOpacity onPress={() => router.push('/(finance)/transactions')}>
                                <Text style={styles.financeLink}>Detay</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.financeStatsRow}>
                            <View style={styles.financeStat}>
                                <Text style={[styles.financeLabel, isDark && styles.financeLabelDark]}>Gelir</Text>
                                <Text style={styles.financeIncome}>₺{Number(financeReport.totalIncome || 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.financeStat}>
                                <Text style={[styles.financeLabel, isDark && styles.financeLabelDark]}>Gider</Text>
                                <Text style={styles.financeExpense}>₺{Number(financeReport.totalExpense || 0).toFixed(2)}</Text>
                            </View>
                            <View style={styles.financeStat}>
                                <Text style={[styles.financeLabel, isDark && styles.financeLabelDark]}>Net</Text>
                                <Text style={[styles.financeNet, Number(financeReport.balance || 0) >= 0 ? styles.financeIncome : styles.financeExpense]}>
                                    ₺{Number(financeReport.balance || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.financeCompare, isDark && styles.financeCompareDark]}>
                            Onceki aya gore net: %{Number(financeReport.balanceChangePct || 0).toFixed(1)}
                        </Text>
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Hizli Erisim</Text>
                    <TouchableOpacity onPress={() => setShortcutsModalOpen(true)}>
                        <Text style={styles.editLink}>Duzenle</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.shortcutsRow}>
                    {shortcuts.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.shortcutCard, isDark && styles.shortcutCardDark]}
                            activeOpacity={0.7}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View style={[styles.shortcutIcon, { backgroundColor: item.color + '18' }]}>
                                <Ionicons name={item.icon as any} size={26} color={item.color} />
                            </View>
                            <Text style={[styles.shortcutTitle, isDark && styles.shortcutTitleDark]}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                    {shortcuts.length === 0 && (
                        <Text style={styles.emptyShortcuts}>Hizli erisim eklemek icin Duzenle butonuna tiklayin.</Text>
                    )}
                </View>

                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Yaklasan Hatirlaticilar</Text>
                {pendingReminders.length === 0 ? (
                    <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
                        <Ionicons name="time-outline" size={34} color={isDark ? '#4B5563' : '#E0E0E0'} />
                        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>Planli hatirlatici yok</Text>
                    </View>
                ) : (
                    pendingReminders.slice(0, 3).map((r) => (
                        <TouchableOpacity key={r.id} style={[styles.reminderCard, isDark && styles.reminderCardDark]} onPress={() => router.push('/(reminders)/reminders')}>
                            <Ionicons name="alarm-outline" size={18} color={PURPLE} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.reminderTitle, isDark && styles.reminderTitleDark]}>{r.title}</Text>
                                <Text style={[styles.reminderTime, isDark && styles.reminderTimeDark]}>
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
                    <Pressable style={[styles.modalCard, isDark && styles.modalCardDark]} onPress={() => undefined}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Bildirimler</Text>
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

            <Modal visible={shortcutsModalOpen} transparent animationType="slide" onRequestClose={() => setShortcutsModalOpen(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShortcutsModalOpen(false)}>
                    <Pressable style={styles.modalCard} onPress={() => undefined}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Hizli Erisim Duzenle</Text>
                                <Text style={styles.modalSub}>En fazla 3 adet secilebilir</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShortcutsModalOpen(false)}>
                                <Ionicons name="close" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {menuModules.map((module) => {
                                const isSelected = (shortcutsIds || []).includes(module.id);
                                return (
                                    <TouchableOpacity
                                        key={module.id}
                                        style={[styles.moduleOption, isSelected && styles.moduleOptionSelected]}
                                        onPress={() => handleToggleShortcut(module.id)}
                                    >
                                        <View style={[styles.moduleIcon, { backgroundColor: module.color + '20' }]}>
                                            <Ionicons name={module.icon as any} size={20} color={module.color} />
                                        </View>
                                        <Text style={styles.moduleName}>{module.title}</Text>
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={styles.modalAction} onPress={() => setShortcutsModalOpen(false)}>
                            <Text style={styles.modalActionText}>Tamam</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    containerDark: { backgroundColor: '#0B1220' },
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
    financeCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 22,
    },
    financeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    financeTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    financeLink: { fontSize: 12, fontWeight: '700', color: PURPLE },
    financeStatsRow: { flexDirection: 'row', gap: 8 },
    financeStat: { flex: 1 },
    financeLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
    financeIncome: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
    financeExpense: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
    financeNet: { fontSize: 13, fontWeight: '800' },
    financeCompare: { marginTop: 10, fontSize: 12, color: '#475569' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
    editLink: { fontSize: 14, color: PURPLE, fontWeight: '600' },
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
    emptyShortcuts: { fontSize: 14, color: GRAY, fontStyle: 'italic', flex: 1, textAlign: 'center', paddingVertical: 10 },
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
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
    modalSub: { fontSize: 12, color: GRAY, marginTop: 2 },
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
    modalActionsRow: { marginTop: 16, flexDirection: 'row', gap: 8 },
    modalActionGhost: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#fff',
    },
    modalActionGhostText: { color: '#334155', fontSize: 14, fontWeight: '800' },
    modalAction: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: PURPLE,
        marginTop: 10,
    },
    modalActionText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    moduleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    moduleOptionSelected: {
        backgroundColor: '#F8F9FA',
    },
    moduleIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moduleName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: PURPLE,
        borderColor: PURPLE,
    },

    /* ─── Dark Mode ─── */
    greetingDark: { color: '#94A3B8' },
    userNameDark: { color: '#E5E7EB' },
    notifyButtonDark: { backgroundColor: '#1E293B' },
    financeCardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    financeTitleDark: { color: '#E5E7EB' },
    financeLabelDark: { color: '#94A3B8' },
    financeCompareDark: { color: '#94A3B8' },
    sectionTitleDark: { color: '#E5E7EB' },
    shortcutCardDark: { backgroundColor: '#111827' },
    shortcutTitleDark: { color: '#E5E7EB' },
    emptyCardDark: { backgroundColor: '#111827' },
    emptyTextDark: { color: '#E5E7EB' },
    reminderCardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    reminderTitleDark: { color: '#E5E7EB' },
    reminderTimeDark: { color: '#94A3B8' },
    modalCardDark: { backgroundColor: '#111827' },
    modalTitleDark: { color: '#E5E7EB' },
});

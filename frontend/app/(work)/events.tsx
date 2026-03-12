// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { workService } from '../../services/work.service';
import type { WorkEvent, WorkEventsSummary } from '../../src/models/work.model';
import { MascotButton } from '../../components/ui/MascotButton';
import { InterviewConsentModal } from '../../components/ui/InterviewConsentModal';

const COLOR = '#5B8DEF';
const QUICK_FILTERS = ['ALL', 'UPCOMING', 'ONGOING', 'TODAY', 'THIS_WEEK'] as const;
const QUICK_FILTER_LABELS: Record<(typeof QUICK_FILTERS)[number], string> = {
    ALL: 'Tum',
    UPCOMING: 'Yaklasan',
    ONGOING: 'Devam Eden',
    TODAY: 'Bugun',
    THIS_WEEK: 'Bu Hafta',
};
const PRIORITIES = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
    ALL: 'Tum Oncelikler',
    LOW: 'Dusuk',
    MEDIUM: 'Orta',
    HIGH: 'Yuksek',
    URGENT: 'Acil',
};
const STATUSES = ['ALL', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'] as const;
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
    ALL: 'Tum Durumlar',
    SCHEDULED: 'Planlandi',
    ONGOING: 'Devam Ediyor',
    COMPLETED: 'Tamamlandi',
    CANCELLED: 'Iptal',
    POSTPONED: 'Ertelendi',
};

type QuickFilter = (typeof QUICK_FILTERS)[number];
type PriorityFilter = (typeof PRIORITIES)[number];
type StatusFilter = (typeof STATUSES)[number];
type ToastType = 'success' | 'error' | 'info';

const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const cardTone = (event: WorkEvent) => {
    const status = event.status || '';
    const priority = event.priority || '';
    if (status === 'COMPLETED') return { bg: '#ECFDF5', border: '#34D399', dot: '#10B981' };
    if (status === 'CANCELLED') return { bg: '#F8FAFC', border: '#CBD5E1', dot: '#94A3B8' };
    if (priority === 'URGENT') return { bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' };
    if (priority === 'HIGH') return { bg: '#FFF7ED', border: '#FDBA74', dot: '#F97316' };
    if (priority === 'MEDIUM') return { bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' };
    return { bg: '#EFF6FF', border: '#93C5FD', dot: '#3B82F6' };
};

export default function WorkEventsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [events, setEvents] = useState<WorkEvent[]>([]);
    const [summary, setSummary] = useState<WorkEventsSummary | null>(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<ToastType>('info');
    const [consentVisible, setConsentVisible] = useState(false);

    const handleMascotPress = () => {
        setConsentVisible(true);
    };

    const handleConsentConfirm = () => {
        setConsentVisible(false);
        router.push('/(work)/my-interviews');
    };

    const showToast = (type: ToastType, message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
        return () => clearTimeout(t);
    }, [query]);

    const loadSummary = useCallback(async () => {
        try {
            const data = await workService.getEventsSummary();
            setSummary(data);
        } catch {
            setSummary(null);
        }
    }, []);

    const loadEvents = useCallback(async () => {
        try {
            let list: WorkEvent[] = [];
            if (debouncedQuery.length >= 2) {
                const page = await workService.searchEvents(debouncedQuery, 0, 100);
                list = page.content || [];
            } else {
                if (quickFilter === 'UPCOMING') list = await workService.getUpcomingEvents();
                if (quickFilter === 'ONGOING') list = await workService.getOngoingEvents();
                if (quickFilter === 'TODAY') list = await workService.getTodayEvents();
                if (quickFilter === 'THIS_WEEK') list = await workService.getThisWeekEvents();
                if (quickFilter === 'ALL') {
                    const page = await workService.getEventsPage({ page: 0, size: 100, sort: 'startTime,asc' });
                    list = page.content || [];
                }
            }

            const filtered = list
                .filter((e) => (priorityFilter === 'ALL' ? true : e.priority === priorityFilter))
                .filter((e) => (statusFilter === 'ALL' ? true : e.status === statusFilter))
                .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
            setEvents(filtered);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Toplantilar alinamadi.');
            setEvents([]);
        }
    }, [debouncedQuery, priorityFilter, quickFilter, statusFilter]);

    const reloadAll = useCallback(async (pullToRefresh = false) => {
        if (pullToRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            await Promise.all([loadSummary(), loadEvents()]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loadEvents, loadSummary]);

    useFocusEffect(
        useCallback(() => {
            void reloadAll();
        }, [reloadAll]),
    );

    useEffect(() => {
        if (!loading) {
            void loadEvents();
        }
    }, [loadEvents, loading]);

    const completeEvent = async (id: string) => {
        try {
            await workService.updateEventStatus(id, 'COMPLETED');
            showToast('success', 'Toplanti tamamlandi.');
            await reloadAll();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Durum guncellenemedi.');
        }
    };

    const deleteEvent = (id: string) => {
        Alert.alert('Toplantiyi Sil', 'Bu toplanti kalici olarak silinsin mi?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await workService.deleteEvent(id);
                        showToast('success', 'Toplanti silindi.');
                        await reloadAll();
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Toplanti silinemedi.');
                    }
                },
            },
        ]);
    };

    const counts = useMemo(() => {
        return {
            total: summary?.totalEvents ?? events.length,
            upcoming: summary?.upcomingEvents ?? 0,
            today: summary?.todayEvents ?? 0,
        };
    }, [events.length, summary]);
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (quickFilter !== 'ALL') count += 1;
        if (statusFilter !== 'ALL') count += 1;
        if (priorityFilter !== 'ALL') count += 1;
        return count;
    }, [priorityFilter, quickFilter, statusFilter]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Is</Text>
                    <TouchableOpacity onPress={() => router.push('/(work)/create-event')} style={styles.iconBtn}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* TABS */}
                <View style={styles.tabRow}>
                    <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                        <Text style={[styles.tabTxt, styles.activeTabTxt]}>Toplantılarım</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tab} onPress={() => router.replace('/(work)/my-interviews')}>
                        <Text style={styles.tabTxt}>Mülakatlarım</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <StatItem value={counts.total} label="Toplanti" />
                    <StatItem value={counts.upcoming} label="Yaklasan" />
                    <StatItem value={counts.today} label="Bugun" />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => reloadAll(true)} />}
            >
                <View style={styles.searchRow}>
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Toplanti ara (min. 2 karakter)"
                        style={styles.searchInput}
                    />
                    <TouchableOpacity style={styles.filterBtn} onPress={() => setFiltersVisible(true)}>
                        <Ionicons name="options-outline" size={16} color={COLOR} />
                        <Text style={styles.filterBtnText}>Filtrele</Text>
                        {activeFilterCount > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Toplantilar</Text>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                    </View>
                ) : events.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyTitle}>Toplanti bulunamadi</Text>
                        <Text style={styles.emptySub}>Filtreleri degistirebilir veya yeni toplanti ekleyebilirsin.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {events.map((event) => {
                            const tone = cardTone(event);
                            return (
                                <TouchableOpacity
                                    key={event.id}
                                    style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}
                                    activeOpacity={0.88}
                                    onPress={() => router.push({ pathname: '/(work)/event-detail', params: { id: event.id } })}
                                >
                                    <View style={[styles.cardDot, { backgroundColor: tone.dot }]} />
                                    <View style={styles.cardBody}>
                                        <Text style={styles.cardTitle}>{event.title}</Text>
                                        <Text style={styles.cardTime}>{formatDateTime(event.startTime)}</Text>
                                        <View style={styles.metaRow}>
                                            <MiniTag text={PRIORITY_LABELS[(event.priority as PriorityFilter) || 'LOW']} />
                                            <MiniTag text={STATUS_LABELS[(event.status as StatusFilter) || 'SCHEDULED']} />
                                            <MiniTag text={event.isOnline ? 'Online' : 'Fiziksel'} />
                                        </View>
                                        <Text style={styles.cardLocation}>{event.location || 'Belirlenecek'}</Text>
                                    </View>
                                    <View style={styles.cardActions}>
                                        {event.status !== 'COMPLETED' && (
                                            <TouchableOpacity style={styles.actionBtn} onPress={() => completeEvent(event.id)}>
                                                <Ionicons name="checkmark" size={16} color="#64748B" />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => deleteEvent(event.id)}>
                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />

            <Modal
                visible={filtersVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFiltersVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setFiltersVisible(false)}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <Pressable style={styles.modalSheet} onPress={() => undefined}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Filtreler</Text>
                                    <Text style={styles.modalSubTitle}>Toplantilari daha hizli daralt</Text>
                                </View>
                                <TouchableOpacity onPress={() => setFiltersVisible(false)}>
                                    <Ionicons name="close" size={20} color="#334155" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                                <Text style={styles.modalLabel}>Zaman</Text>
                                <View style={styles.modalChips}>
                                    {QUICK_FILTERS.map((item) => (
                                        <Chip
                                            key={item}
                                            label={QUICK_FILTER_LABELS[item]}
                                            selected={quickFilter === item}
                                            onPress={() => setQuickFilter(item)}
                                            small
                                        />
                                    ))}
                                </View>

                                <Text style={styles.modalLabel}>Durum</Text>
                                <View style={styles.modalChips}>
                                    {STATUSES.map((item) => (
                                        <Chip
                                            key={item}
                                            label={STATUS_LABELS[item]}
                                            selected={statusFilter === item}
                                            onPress={() => setStatusFilter(item)}
                                            small
                                        />
                                    ))}
                                </View>

                                <Text style={styles.modalLabel}>Oncelik</Text>
                                <View style={styles.modalChips}>
                                    {PRIORITIES.map((item) => (
                                        <Chip
                                            key={item}
                                            label={PRIORITY_LABELS[item]}
                                            selected={priorityFilter === item}
                                            onPress={() => setPriorityFilter(item)}
                                            small
                                        />
                                    ))}
                                </View>
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.clearBtn}
                                    onPress={() => {
                                        setQuickFilter('ALL');
                                        setStatusFilter('ALL');
                                        setPriorityFilter('ALL');
                                    }}
                                >
                                    <Text style={styles.clearBtnText}>Temizle</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.applyBtn} onPress={() => setFiltersVisible(false)}>
                                    <Text style={styles.applyBtnText}>Uygula</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </KeyboardAvoidingView>
                </Pressable>
            </Modal>

            <MascotButton onPress={handleMascotPress} />

            <InterviewConsentModal
                visible={consentVisible}
                onClose={() => setConsentVisible(false)}
                onConfirm={handleConsentConfirm}
            />
        </View>
    );
}

function Chip({
    label,
    selected,
    onPress,
    small = false,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    small?: boolean;
}) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.chip, small && styles.chipSmall, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );
}

function StatItem({ value, label }: { value: number; label: string }) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function MiniTag({ text }: { text: string }) {
    return (
        <View style={styles.miniTag}>
            <Text style={styles.miniTagText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        paddingBottom: 14,
        paddingTop: Platform.OS === 'ios' ? 58 : 36,
    },
    headerTop: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 18,
        marginBottom: 8,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#fff',
    },
    tabTxt: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabTxt: {
        color: '#fff',
        fontWeight: '800',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    statsRow: { marginTop: 10, flexDirection: 'row', paddingHorizontal: 16, justifyContent: 'space-between' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { color: '#fff', fontSize: 30, fontWeight: '800' },
    statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
    content: { padding: 14, paddingBottom: 28 },
    searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    chip: {
        backgroundColor: '#E2E8F0',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    chipSmall: {
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    chipSelected: { backgroundColor: COLOR },
    chipText: { fontSize: 13, fontWeight: '700', color: '#334155' },
    chipTextSelected: { color: '#fff' },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
        fontSize: 14,
        color: '#0F172A',
    },
    filterBtn: {
        height: 46,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    filterBtnText: { fontSize: 13, fontWeight: '700', color: COLOR },
    filterBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 999,
        backgroundColor: COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    sectionTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginTop: 6, marginBottom: 10 },
    centered: { paddingVertical: 40, alignItems: 'center' },
    list: { gap: 10 },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    cardDot: { width: 8, height: 8, borderRadius: 99, marginTop: 8 },
    cardBody: { flex: 1, gap: 5 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    cardTime: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    miniTag: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    miniTagText: { fontSize: 11, fontWeight: '700', color: '#334155' },
    cardLocation: { fontSize: 12, color: '#334155', fontWeight: '600' },
    cardActions: { gap: 8, paddingTop: 3 },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#FFFFFFAA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 13, color: '#64748B' },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.35)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        maxHeight: '82%',
        shadowColor: '#0F172A',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: -4 },
        elevation: 14,
    },
    modalHandle: {
        alignSelf: 'center',
        width: 44,
        height: 5,
        borderRadius: 99,
        backgroundColor: '#CBD5E1',
        marginBottom: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    modalSubTitle: { marginTop: 2, fontSize: 12, color: '#64748B', fontWeight: '600' },
    modalBody: { paddingBottom: 8 },
    modalLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 6 },
    modalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    clearBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    clearBtnText: { color: '#334155', fontSize: 14, fontWeight: '700' },
    applyBtn: {
        flex: 1,
        backgroundColor: COLOR,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
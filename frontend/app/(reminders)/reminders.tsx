// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { googleCalendarService } from '../../services/google-calendar.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { remindersService } from '../../services/reminders.service';
import type { Reminder, ReminderRecurrence, ReminderStatus } from '../../src/models/reminder.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#60A5FA';
const FILTERS = ['all', 'scheduled', 'sent', 'skipped', 'canceled'] as const;
const FILTER_LABELS: Record<(typeof FILTERS)[number], string> = {
    all: 'Tum',
    scheduled: 'Planli',
    sent: 'Gonderildi',
    skipped: 'Atlandi',
    canceled: 'Iptal',
};
const REPEAT_TYPES = ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const;
const REPEAT_LABELS: Record<(typeof REPEAT_TYPES)[number], string> = {
    none: 'Tek Sefer',
    daily: 'Her Gun',
    weekly: 'Haftalik',
    monthly: 'Aylik',
    yearly: 'Yillik',
};

type FilterValue = (typeof FILTERS)[number];

const toBackendOffsetDateTime = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const oh = pad(Math.floor(abs / 60));
    const om = pad(abs % 60);
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${oh}:${om}`;
};

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

const categoryTone = (sourceModule: Reminder['sourceModule']) => {
    if (sourceModule === 'family') return { bg: '#FFF1F2', bar: '#F43F5E', label: 'Dogum Gunu' };
    if (sourceModule === 'work') return { bg: '#EEF2FF', bar: '#6366F1', label: 'Toplanti' };
    return { bg: '#F0FDF4', bar: '#22C55E', label: 'Kisisel' };
};

export default function RemindersScreen() {
    const router = useRouter();
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [filter, setFilter] = useState<FilterValue>('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [title, setTitle] = useState('');
    const [repeat, setRepeat] = useState<ReminderRecurrence>('none');
    const [remindAt, setRemindAt] = useState(new Date(Date.now() + 30 * 60 * 1000));
    const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
    const [saving, setSaving] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const loadReminders = useCallback(async () => {
        setLoading(true);
        try {
            const page = await remindersService.getAll(0, 100);
            setReminders(page.content || []);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Hatirlaticilar alinamadi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadReminders();
        }, [loadReminders]),
    );

    const filteredReminders = useMemo(() => {
        const byFilter = reminders.filter((r) => (filter === 'all' ? true : r.status === filter));
        return byFilter.sort((a, b) => +new Date(a.remindAt) - +new Date(b.remindAt));
    }, [filter, reminders]);

    const now = new Date();
    const upcomingReminders = useMemo(
        () => filteredReminders.filter((r) => r.status === 'scheduled' && new Date(r.remindAt) >= now),
        [filteredReminders],
    );
    const expiredReminders = useMemo(
        () => filteredReminders.filter((r) => r.status === 'scheduled' && new Date(r.remindAt) < now),
        [filteredReminders],
    );
    const otherReminders = useMemo(
        () => filteredReminders.filter((r) => r.status !== 'scheduled'),
        [filteredReminders],
    );

    const activeCount = useMemo(
        () => reminders.filter((r) => r.status === 'scheduled').length,
        [reminders],
    );

    const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === 'android') setPickerMode(null);
        if (event.type === 'dismissed' || !selected) return;

        const next = new Date(remindAt);
        if (pickerMode === 'date') {
            next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        } else {
            next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        }
        setRemindAt(next);
    };

    const createReminder = async () => {
        if (!title.trim()) {
            showToast('error', 'Baslik zorunlu.');
            return;
        }
        if (remindAt.getTime() < Date.now() - 60 * 1000) {
            showToast('error', 'Hatirlatma zamani gecmiste olamaz.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: title.trim(),
                remindAt: toBackendOffsetDateTime(remindAt),
                recurrence: repeat,
                sourceModule: editingReminder?.sourceModule || 'general',
                channel: editingReminder?.channel || 'in_app',
                workEventId: editingReminder?.workEventId || undefined,
                contactId: editingReminder?.contactId || undefined,
            };
            if (editingReminder) {
                await remindersService.update(editingReminder.id, payload);
            } else {
                await remindersService.create(payload);
            }
            showToast('success', editingReminder ? 'Hatirlatici guncellendi.' : 'Hatirlatici olusturuldu.');
            setModalVisible(false);
            setTitle('');
            setRepeat('none');
            setEditingReminder(null);
            setRemindAt(new Date(Date.now() + 30 * 60 * 1000));
            await loadReminders();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || (editingReminder ? 'Hatirlatici guncellenemedi.' : 'Hatirlatici olusturulamadi.'));
        } finally {
            setSaving(false);
        }
    };

    const openCreateModal = () => {
        setEditingReminder(null);
        setTitle('');
        setRepeat('none');
        setRemindAt(new Date(Date.now() + 30 * 60 * 1000));
        setModalVisible(true);
    };

    const openEditModal = (reminder: Reminder) => {
        setEditingReminder(reminder);
        setTitle(reminder.title || '');
        setRepeat((reminder.recurrence as ReminderRecurrence) || 'none');
        setRemindAt(new Date(reminder.remindAt));
        setModalVisible(true);
    };

    const postponeReminder = async (reminder: Reminder, minutes: number) => {
        try {
            const next = new Date(new Date(reminder.remindAt).getTime() + minutes * 60 * 1000);
            await remindersService.update(reminder.id, {
                title: reminder.title,
                remindAt: toBackendOffsetDateTime(next),
                recurrence: reminder.recurrence,
                sourceModule: reminder.sourceModule,
                channel: reminder.channel,
                workEventId: reminder.workEventId || undefined,
                contactId: reminder.contactId || undefined,
            });
            showToast('success', 'Hatirlatici ertelendi.');
            await loadReminders();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Ertelenemedi.');
        }
    };

    const updateStatus = async (id: string, status: ReminderStatus) => {
        try {
            await remindersService.updateStatus(id, status);
            await loadReminders();
            showToast('success', 'Durum guncellendi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Durum guncellenemedi.');
        }
    };

    const handleResync = async () => {
        setIsSyncing(true);
        try {
            await googleCalendarService.resync();
            showToast('success', 'Google Takvim ile tüm veriler senkronize edildi.');
            await loadReminders();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Senkronizasyon başarısız.');
        } finally {
            setIsSyncing(false);
        }
    };

    const removeReminder = (id: string) => {
        Alert.alert('Hatirlaticiyi sil', 'Bu kayit kalici olarak silinsin mi?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await remindersService.delete(id);
                        await loadReminders();
                        showToast('success', 'Hatirlatici silindi.');
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Silinemedi.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Hatirlaticilar</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={handleResync} style={styles.backBtn} disabled={isSyncing}>
                            {isSyncing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="sync" size={20} color="#fff" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={openCreateModal} style={styles.backBtn}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.summaryRow}>
                    <Ionicons name="alarm" size={28} color="#fff" />
                    <View>
                        <Text style={styles.summaryNum}>{activeCount} aktif</Text>
                        <Text style={styles.summarySub}>{reminders.length} toplam hatirlatici</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.filterWrap, isDark && styles.filterWrapDark]}>
                {FILTERS.map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[styles.filterPill, filter === item && styles.filterPillActive]}
                        onPress={() => setFilter(item)}
                    >
                        <Text style={[styles.filterPillText, filter === item && styles.filterPillTextActive]}>
                            {FILTER_LABELS[item]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                    </View>
                ) : filteredReminders.length === 0 ? (
                    <View style={[styles.emptyBox, isDark && styles.emptyBoxDark]}>
                        <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Kayit yok</Text>
                        <Text style={[styles.emptySub, isDark && styles.subTextDark]}>Yeni bir hatirlatici ekleyebilirsin.</Text>
                    </View>
                ) : (
                    <>
                        {expiredReminders.length > 0 && (
                            <>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionHeaderDot} />
                                    <Text style={[styles.sectionHeaderText, { color: '#EF4444' }]}>Süresi Geçmiş ({expiredReminders.length})</Text>
                                </View>
                                {expiredReminders.map((r) => (
                                    <View key={r.id} style={[styles.card, isDark && styles.cardDark, styles.cardExpired]}>
                                        <View style={[styles.categoryBar, { backgroundColor: '#EF4444' }]} />
                                        <View style={styles.cardHeader}>
                                            <Text style={[styles.cardTitle, isDark && styles.textDark, { opacity: 0.7 }]} numberOfLines={1}>{r.title}</Text>
                                            <StatusBadge status={r.status} expired />
                                        </View>
                                        <View style={styles.cardFooter}>
                                            <Text style={[styles.cardTime, { color: '#EF4444' }]}>{formatDateTime(r.remindAt)}</Text>
                                            <View style={styles.metaRow}>
                                                <MiniTag text={categoryTone(r.sourceModule).label} />
                                                {r.recurrence !== 'none' && <MiniTag text={REPEAT_LABELS[r.recurrence as (typeof REPEAT_TYPES)[number]] || r.recurrence} />}
                                            </View>
                                        </View>
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity style={styles.iconAction} onPress={() => openEditModal(r)}>
                                                <Ionicons name="create-outline" size={20} color="#64748B" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.iconAction, styles.iconActionDanger]} onPress={() => removeReminder(r.id)}>
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}

                        {(upcomingReminders.length > 0 || otherReminders.length > 0) && expiredReminders.length > 0 && (
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionHeaderDot, { backgroundColor: '#22C55E' }]} />
                                <Text style={[styles.sectionHeaderText, isDark && styles.subTextDark]}>Yaklaşan Hatirlaticilar ({upcomingReminders.length + otherReminders.length})</Text>
                            </View>
                        )}

                        {[...upcomingReminders, ...otherReminders].map((r) => (
                            <View key={r.id} style={[styles.card, isDark && styles.cardDark]}>
                                <View style={[styles.categoryBar, { backgroundColor: categoryTone(r.sourceModule).bar }]} />
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.cardTitle, isDark && styles.textDark]} numberOfLines={1}>{r.title}</Text>
                                    <StatusBadge status={r.status} />
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={[styles.cardTime, isDark && styles.subTextDark]}>{formatDateTime(r.remindAt)}</Text>
                                    <View style={styles.metaRow}>
                                        <MiniTag text={categoryTone(r.sourceModule).label} />
                                        {r.recurrence !== 'none' && <MiniTag text={REPEAT_LABELS[r.recurrence as (typeof REPEAT_TYPES)[number]] || r.recurrence} />}
                                    </View>
                                </View>
                                <View style={styles.actionRow}>
                                    {r.status === 'scheduled' && (
                                        <TouchableOpacity style={styles.iconAction} onPress={() => updateStatus(r.id, 'sent')}>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
                                        </TouchableOpacity>
                                    )}
                                    {r.status === 'scheduled' && (
                                        <TouchableOpacity style={styles.iconAction} onPress={() => postponeReminder(r, 24 * 60)}>
                                            <Ionicons name="time-outline" size={20} color="#64748B" />
                                        </TouchableOpacity>
                                    )}
                                    {r.status !== 'scheduled' && (
                                        <TouchableOpacity style={styles.iconAction} onPress={() => updateStatus(r.id, 'scheduled')}>
                                            <Ionicons name="refresh-outline" size={20} color="#64748B" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.iconAction} onPress={() => openEditModal(r)}>
                                        <Ionicons name="create-outline" size={20} color="#64748B" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.iconAction, styles.iconActionDanger]} onPress={() => removeReminder(r.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setModalVisible(false);
                    setEditingReminder(null);
                }}
            >
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>{editingReminder ? 'Hatirlatici Duzenle' : 'Yeni Hatirlatici'}</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Baslik"
                            style={[styles.input, isDark && styles.inputDark]}
                        />

                        <View style={styles.pickRow}>
                            <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerMode('date')}>
                                <Ionicons name="calendar-outline" size={16} color={COLOR} />
                                <Text style={styles.pickText}>
                                    {remindAt.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerMode('time')}>
                                <Ionicons name="time-outline" size={16} color={COLOR} />
                                <Text style={styles.pickText}>
                                    {remindAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.repeatRow}>
                            {REPEAT_TYPES.map((item) => (
                                <OptionChip
                                    key={item}
                                    label={REPEAT_LABELS[item]}
                                    selected={repeat === item}
                                    onPress={() => setRepeat(item)}
                                />
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setModalVisible(false);
                                    setEditingReminder(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>Vazgec</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmitBtn, saving && { opacity: 0.7 }]}
                                onPress={createReminder}
                                disabled={saving}
                            >
                                <Text style={styles.modalSubmitText}>{saving ? 'Kaydediliyor...' : editingReminder ? 'Guncelle' : 'Kaydet'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {pickerMode && (
                <DateTimePicker
                    value={remindAt}
                    mode={pickerMode}
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPickerChange}
                />
            )}

            <Toast
                visible={toastVisible}
                type={toastType}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
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

function OptionChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.optionChip, selected && styles.optionChipSelected]}>
            <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );
}

function StatusBadge({ status, expired }: { status: ReminderStatus; expired?: boolean }) {
    const label =
        expired
            ? 'Süresi Geçti'
            : status === 'scheduled'
                ? 'Planli'
                : status === 'sent'
                    ? 'Gonderildi'
                    : status === 'skipped'
                        ? 'Atlandi'
                        : 'Iptal';
    const bg =
        expired
            ? '#FEE2E2'
            : status === 'scheduled'
                ? '#DBEAFE'
                : status === 'sent'
                    ? '#DCFCE7'
                    : status === 'skipped'
                        ? '#F1F5F9'
                        : '#FEE2E2';
    const fg =
        expired
            ? '#B91C1C'
            : status === 'scheduled'
                ? '#1D4ED8'
                : status === 'sent'
                    ? '#15803D'
                    : status === 'skipped'
                        ? '#475569'
                        : '#DC2626';

    return (
        <View style={[styles.statusBadge, { backgroundColor: bg }]}>
            <Text style={[styles.statusText, { color: fg }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 28, marginTop: 16 },
    summaryNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
    summarySub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    filterWrap: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 8,
    },
    filterPill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 10,
    },
    filterPillActive: { backgroundColor: '#BFDBFE' },
    filterPillText: { color: '#475569', fontSize: 12, fontWeight: '700' },
    filterPillTextActive: { color: '#1D4ED8' },
    optionChip: { backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    optionChipSelected: { backgroundColor: COLOR },
    optionChipText: { color: '#334155', fontSize: 12, fontWeight: '700' },
    optionChipTextSelected: { color: '#fff' },
    scroll: { paddingHorizontal: 14, paddingBottom: 28 },
    centered: { alignItems: 'center', paddingVertical: 36 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
    },
    categoryBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0F172A' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    cardTime: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    metaRow: { flexDirection: 'row', gap: 4 },
    miniTag: { backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
    miniTagText: { fontSize: 10, fontWeight: '600', color: '#334155' },
    statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 10, fontWeight: '800' },
    actionRow: { marginTop: 8, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
    iconAction: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconActionDanger: { backgroundColor: '#FEF2F2' },
    emptyBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 2, fontSize: 12, color: '#64748B' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    pickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    pickBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pickText: { fontSize: 13, fontWeight: '700', color: '#334155' },
    repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
    modalCancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    modalCancelText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    modalSubmitBtn: {
        flex: 1,
        backgroundColor: COLOR,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    modalSubmitText: { fontSize: 14, fontWeight: '800', color: '#fff' },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    filterWrapDark: { backgroundColor: '#0B1220' },
    emptyBoxDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    modalSheetDark: { backgroundColor: '#111827' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 8 },
    sectionHeaderDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    sectionHeaderText: { fontSize: 13, fontWeight: '800', color: '#EF4444' },
    cardExpired: { opacity: 0.85 },
});
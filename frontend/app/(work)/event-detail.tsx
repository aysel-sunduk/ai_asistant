// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { workService } from '../../services/work.service';
import type { WorkEvent, WorkEventRequest } from '../../src/models/work.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#5B8DEF';
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
    LOW: 'Dusuk',
    MEDIUM: 'Orta',
    HIGH: 'Yuksek',
    URGENT: 'Acil',
};
const STATUSES = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'] as const;
const EVENT_TYPES = [
    'MEETING',
    'TEAM_MEETING',
    'CLIENT_MEETING',
    'ONE_ON_ONE',
    'WORKSHOP',
    'PRESENTATION',
    'OTHER',
] as const;
const REMINDERS = [5, 15, 30, 60] as const;
const LOCATION_OPTIONS = ['Toplanti Odasi A', 'Toplanti Odasi B', 'Acik Ofis', 'Musteri Ofisi', 'Belirlenecek', 'Diger'] as const;

const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
    MEETING: 'Toplanti',
    TEAM_MEETING: 'Ekip Toplantisi',
    CLIENT_MEETING: 'Musteri Toplantisi',
    ONE_ON_ONE: 'Birebir',
    WORKSHOP: 'Calistay',
    PRESENTATION: 'Sunum',
    OTHER: 'Diger',
};
const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
    SCHEDULED: 'Planlandi',
    ONGOING: 'Devam Ediyor',
    COMPLETED: 'Tamamlandi',
    CANCELLED: 'Iptal',
    POSTPONED: 'Ertelendi',
};

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

const formatDate = (d: Date) =>
    d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d: Date) =>
    d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

const mergeDate = (base: Date, part: Date, kind: 'date' | 'time') => {
    const next = new Date(base);
    if (kind === 'date') {
        next.setFullYear(part.getFullYear(), part.getMonth(), part.getDate());
    } else {
        next.setHours(part.getHours(), part.getMinutes(), 0, 0);
    }
    return next;
};

const toDate = (v?: string) => {
    const d = v ? new Date(v) : new Date();
    return Number.isNaN(d.getTime()) ? new Date() : d;
};

export default function EventDetailScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const eventId = typeof params.id === 'string' ? params.id : '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState<WorkEvent | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [participantCount, setParticipantCount] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [locationOption, setLocationOption] = useState<(typeof LOCATION_OPTIONS)[number]>('Belirlenecek');
    const [customLocation, setCustomLocation] = useState('');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('MEDIUM');
    const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>('MEETING');
    const [status, setStatus] = useState<(typeof STATUSES)[number]>('SCHEDULED');
    const [reminderMinutesBefore, setReminderMinutesBefore] = useState<(typeof REMINDERS)[number]>(15);
    const [startAt, setStartAt] = useState(new Date());
    const [endAt, setEndAt] = useState(new Date(Date.now() + 60 * 60 * 1000));

    const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const fillForm = (e: WorkEvent) => {
        setEvent(e);
        setTitle(e.title || '');
        setDescription(e.description || '');
        setParticipantCount(e.participantCount != null ? String(e.participantCount) : '');
        setIsOnline(Boolean(e.isOnline));
        const incomingLocation = e.location || '';
        if (!incomingLocation) {
            setLocationOption('Belirlenecek');
            setCustomLocation('');
        } else if ((LOCATION_OPTIONS as readonly string[]).includes(incomingLocation)) {
            setLocationOption(incomingLocation as (typeof LOCATION_OPTIONS)[number]);
            setCustomLocation('');
        } else {
            setLocationOption('Diger');
            setCustomLocation(incomingLocation);
        }
        setMeetingUrl(e.meetingUrl || '');
        setPriority((e.priority as (typeof PRIORITIES)[number]) || 'MEDIUM');
        setEventType((e.eventType as (typeof EVENT_TYPES)[number]) || 'MEETING');
        setStatus((e.status as (typeof STATUSES)[number]) || 'SCHEDULED');
        setReminderMinutesBefore((e.reminderMinutesBefore as (typeof REMINDERS)[number]) || 15);
        setStartAt(toDate(e.startTime));
        setEndAt(toDate(e.endTime));
    };

    const loadEvent = useCallback(async () => {
        if (!eventId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await workService.getEvent(eventId);
            fillForm(data);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Toplanti detayi alinamadi.');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useFocusEffect(
        useCallback(() => {
            loadEvent();
        }, [loadEvent]),
    );

    const pickerValue = useMemo(() => {
        if (pickerTarget === 'startDate' || pickerTarget === 'startTime') return startAt;
        return endAt;
    }, [endAt, pickerTarget, startAt]);

    const pickerMode = useMemo(() => {
        if (pickerTarget === 'startDate' || pickerTarget === 'endDate') return 'date' as const;
        return 'time' as const;
    }, [pickerTarget]);

    const onPickerChange = (eventData: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === 'android') setPickerTarget(null);
        if (eventData.type === 'dismissed' || !selected || !pickerTarget) return;
        if (pickerTarget === 'startDate') setStartAt((prev) => mergeDate(prev, selected, 'date'));
        if (pickerTarget === 'startTime') setStartAt((prev) => mergeDate(prev, selected, 'time'));
        if (pickerTarget === 'endDate') setEndAt((prev) => mergeDate(prev, selected, 'date'));
        if (pickerTarget === 'endTime') setEndAt((prev) => mergeDate(prev, selected, 'time'));
    };

    const submitUpdate = async () => {
        if (!eventId) return;
        if (!title.trim()) {
            showToast('error', 'Baslik zorunlu.');
            return;
        }
        if (endAt <= startAt) {
            showToast('error', 'Bitis, baslangictan sonra olmali.');
            return;
        }
        if (isOnline && !meetingUrl.trim()) {
            showToast('error', 'Online toplanti icin link zorunlu.');
            return;
        }
        const finalLocation = isOnline
            ? undefined
            : locationOption === 'Diger'
                ? customLocation.trim()
                : locationOption;

        if (!isOnline && !finalLocation) {
            showToast('error', 'Fiziksel toplanti icin konum secmelisin.');
            return;
        }

        const payload: WorkEventRequest = {
            title: title.trim(),
            description: description.trim() || undefined,
            participantCount: participantCount ? Number(participantCount) : undefined,
            isOnline,
            location: finalLocation,
            meetingUrl: isOnline ? meetingUrl.trim() : undefined,
            priority,
            eventType,
            status,
            reminderMinutesBefore,
            startTime: startAt.toISOString(),
            endTime: endAt.toISOString(),
        };

        setSaving(true);
        try {
            const updated = await workService.updateEvent(eventId, payload);
            fillForm(updated);
            showToast('success', 'Toplanti guncellendi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Toplanti guncellenemedi.');
        } finally {
            setSaving(false);
        }
    };

    const changeStatus = async (newStatus: (typeof STATUSES)[number]) => {
        if (!eventId) return;
        if (status === newStatus) return;
        setStatus(newStatus);
        try {
            const updated = await workService.updateEventStatus(eventId, newStatus);
            fillForm(updated);
            showToast('success', `Durum: ${STATUS_LABELS[newStatus]}`);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Durum guncellenemedi.');
            if (event?.status) setStatus(event.status as (typeof STATUSES)[number]);
        }
    };

    const removeEvent = () => {
        if (!eventId) return;
        Alert.alert('Toplantiyi sil', 'Bu toplanti kalici olarak silinsin mi?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await workService.deleteEvent(eventId);
                        showToast('success', 'Toplanti silindi.');
                        setTimeout(() => router.replace('/(work)/events'), 400);
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Toplanti silinemedi.');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={COLOR} />
            </View>
        );
    }

    if (!eventId) {
        return (
            <View style={styles.loadingWrap}>
                <Text>Toplanti id bulunamadi.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>Toplanti Detayi</Text>
                    <TouchableOpacity onPress={removeEvent} style={styles.backBtn}>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 28 }}>
                <Text style={[styles.label, isDark && styles.subTextDark]}>Baslik</Text>
                <TextInput value={title} onChangeText={setTitle} style={[styles.input, isDark && styles.inputDark]} />

                <Text style={[styles.label, isDark && styles.subTextDark]}>Aciklama</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                />

                <Text style={[styles.label, isDark && styles.subTextDark]}>Durum Akisi</Text>
                <View style={styles.chipsWrap}>
                    {STATUSES.map((s) => (
                        <Chip
                            key={s}
                            value={STATUS_LABELS[s]}
                            selected={status === s}
                            onPress={() => changeStatus(s)}
                        />
                    ))}
                </View>

                <Text style={[styles.label, isDark && styles.subTextDark]}>Tarih ve Saat</Text>
                <View style={styles.row2}>
                    <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('startDate')}>
                        <Ionicons name="calendar-outline" size={16} color={COLOR} />
                        <Text style={styles.pickText}>{formatDate(startAt)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('startTime')}>
                        <Ionicons name="time-outline" size={16} color={COLOR} />
                        <Text style={styles.pickText}>{formatTime(startAt)}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.row2}>
                    <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('endDate')}>
                        <Ionicons name="calendar-outline" size={16} color={COLOR} />
                        <Text style={styles.pickText}>{formatDate(endAt)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('endTime')}>
                        <Ionicons name="time-outline" size={16} color={COLOR} />
                        <Text style={styles.pickText}>{formatTime(endAt)}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label, isDark && styles.subTextDark]}>Toplanti Tipi</Text>
                <View style={styles.chipsWrap}>
                    {EVENT_TYPES.map((item) => (
                        <Chip
                            key={item}
                            value={EVENT_TYPE_LABELS[item]}
                            selected={eventType === item}
                            onPress={() => setEventType(item)}
                        />
                    ))}
                </View>

                <Text style={[styles.label, isDark && styles.subTextDark]}>Oncelik</Text>
                <View style={styles.chipsWrap}>
                    {PRIORITIES.map((item) => (
                        <Chip
                            key={item}
                            value={PRIORITY_LABELS[item]}
                            selected={priority === item}
                            onPress={() => setPriority(item)}
                        />
                    ))}
                </View>

                <Text style={[styles.label, isDark && styles.subTextDark]}>Hatirlatma</Text>
                <View style={styles.chipsWrap}>
                    {REMINDERS.map((m) => (
                        <Chip
                            key={m}
                            value={`${m} dk once`}
                            selected={reminderMinutesBefore === m}
                            onPress={() => setReminderMinutesBefore(m)}
                        />
                    ))}
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.labelNoMargin}>Online toplanti</Text>
                    <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ true: COLOR }} />
                </View>

                {!isOnline ? (
                    <>
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Konum</Text>
                        <View style={styles.chipsWrap}>
                            {LOCATION_OPTIONS.map((item) => (
                                <Chip
                                    key={item}
                                    value={item}
                                    selected={locationOption === item}
                                    onPress={() => setLocationOption(item)}
                                />
                            ))}
                        </View>
                        {locationOption === 'Diger' && (
                            <TextInput
                                value={customLocation}
                                onChangeText={setCustomLocation}
                                placeholder="Konum yaz"
                                style={[styles.input, isDark && styles.inputDark]}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Toplanti Linki</Text>
                        <TextInput
                            value={meetingUrl}
                            onChangeText={setMeetingUrl}
                            placeholder="https://meet.google.com/..."
                            style={[styles.input, isDark && styles.inputDark]}
                            autoCapitalize="none"
                        />
                    </>
                )}

                <Text style={[styles.label, isDark && styles.subTextDark]}>Katilimci Sayisi</Text>
                <TextInput
                    value={participantCount}
                    onChangeText={setParticipantCount}
                    placeholder="Orn: 6"
                    keyboardType="number-pad"
                    style={[styles.input, isDark && styles.inputDark]}
                />

                <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={submitUpdate} disabled={saving}>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>{saving ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}</Text>
                </TouchableOpacity>
            </ScrollView>

            {pickerTarget && (
                <DateTimePicker
                    value={pickerValue}
                    mode={pickerMode}
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPickerChange}
                />
            )}

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

function Chip({
    value,
    selected,
    onPress,
}: {
    value: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{value}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 16,
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
    form: { paddingHorizontal: 16, paddingTop: 16 },
    label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8, marginTop: 8 },
    labelNoMargin: { fontSize: 13, fontWeight: '700', color: '#334155' },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    pickBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pickText: { fontSize: 13, fontWeight: '600', color: '#334155' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        backgroundColor: '#EEF2F7',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    chipSelected: { backgroundColor: COLOR },
    chipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
    chipTextSelected: { color: '#fff' },
    switchRow: {
        marginTop: 12,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    submitBtn: {
        marginTop: 20,
        backgroundColor: COLOR,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    submitText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});
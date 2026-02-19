import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
import { remindersService } from '../../services/reminders.service';
import { workService } from '../../services/work.service';

const COLOR = '#5B8DEF';
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
    LOW: 'Dusuk',
    MEDIUM: 'Orta',
    HIGH: 'Yuksek',
    URGENT: 'Acil',
};
const EVENT_TYPES = [
    'MEETING',
    'TEAM_MEETING',
    'CLIENT_MEETING',
    'ONE_ON_ONE',
    'WORKSHOP',
    'PRESENTATION',
    'OTHER',
] as const;
const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
    MEETING: 'Toplanti',
    TEAM_MEETING: 'Ekip Toplantisi',
    CLIENT_MEETING: 'Musteri Toplantisi',
    ONE_ON_ONE: 'Birebir',
    WORKSHOP: 'Calistay',
    PRESENTATION: 'Sunum',
    OTHER: 'Diger',
};
const REMINDERS = [5, 15, 30, 60] as const;
const LOCATION_OPTIONS = ['Toplanti Odasi A', 'Toplanti Odasi B', 'Acik Ofis', 'Musteri Ofisi', 'Belirlenecek', 'Diger'] as const;

const formatDate = (d: Date) =>
    d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d: Date) =>
    d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

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

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

const mergeDate = (base: Date, part: Date, kind: 'date' | 'time') => {
    const next = new Date(base);
    if (kind === 'date') {
        next.setFullYear(part.getFullYear(), part.getMonth(), part.getDate());
    } else {
        next.setHours(part.getHours(), part.getMinutes(), 0, 0);
    }
    return next;
};

export default function CreateEventScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [participantCount, setParticipantCount] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [locationOption, setLocationOption] = useState<(typeof LOCATION_OPTIONS)[number]>('Belirlenecek');
    const [customLocation, setCustomLocation] = useState('');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('MEDIUM');
    const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>('MEETING');
    const [reminderMinutesBefore, setReminderMinutesBefore] = useState<(typeof REMINDERS)[number]>(15);
    const [startAt, setStartAt] = useState(new Date(Date.now() + 30 * 60 * 1000));
    const [endAt, setEndAt] = useState(new Date(Date.now() + 90 * 60 * 1000));
    const [submitting, setSubmitting] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const pickerValue = useMemo(() => {
        if (pickerTarget === 'startDate' || pickerTarget === 'startTime') return startAt;
        return endAt;
    }, [endAt, pickerTarget, startAt]);

    const pickerMode = useMemo(() => {
        if (pickerTarget === 'startDate' || pickerTarget === 'endDate') return 'date' as const;
        return 'time' as const;
    }, [pickerTarget]);

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === 'android') setPickerTarget(null);
        if (event.type === 'dismissed' || !selected || !pickerTarget) return;
        if (pickerTarget === 'startDate') setStartAt((prev) => mergeDate(prev, selected, 'date'));
        if (pickerTarget === 'startTime') setStartAt((prev) => mergeDate(prev, selected, 'time'));
        if (pickerTarget === 'endDate') setEndAt((prev) => mergeDate(prev, selected, 'date'));
        if (pickerTarget === 'endTime') setEndAt((prev) => mergeDate(prev, selected, 'time'));
    };

    const submit = async () => {
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

        setSubmitting(true);
        try {
            const createdEvent = await workService.createEvent({
                title: title.trim(),
                description: description.trim() || undefined,
                participantCount: participantCount ? Number(participantCount) : undefined,
                isOnline,
                location: finalLocation,
                meetingUrl: isOnline ? meetingUrl.trim() : undefined,
                priority,
                eventType,
                reminderMinutesBefore,
                startTime: startAt.toISOString(),
                endTime: endAt.toISOString(),
            });

            if (createdEvent?.id && reminderMinutesBefore > 0) {
                const remindAt = new Date(startAt.getTime() - reminderMinutesBefore * 60 * 1000);
                try {
                    await remindersService.create({
                        title: `${title.trim()} toplanti hatirlaticisi`,
                        remindAt: toBackendOffsetDateTime(remindAt),
                        workEventId: createdEvent.id,
                        sourceModule: 'work',
                        recurrence: 'none',
                        channel: 'in_app',
                    });
                } catch {
                    // Ignore reminder error
                }
            }
            showToast('success', 'Toplanti basariyla olusturuldu.');
            setTimeout(() => router.replace('/(work)/events'), 500);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Toplanti olusturulamadi.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yeni Toplanti</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                {/* Title & Description Card */}
                <View style={styles.card}>
                    <Text style={styles.label}>Baslik</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Orn: Sprint Planning"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Aciklama</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Toplanti notu (opsiyonel)"
                        placeholderTextColor="#94A3B8"
                        multiline
                        style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                    />
                </View>

                {/* Date & Time Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Zamanlama</Text>

                    <View style={styles.timeRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>Baslangic</Text>
                            <View style={styles.pickerGroup}>
                                <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('startDate')}>
                                    <Ionicons name="calendar-outline" size={18} color={COLOR} />
                                    <Text style={styles.pickText}>{formatDate(startAt)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('startTime')}>
                                    <Ionicons name="time-outline" size={18} color={COLOR} />
                                    <Text style={styles.pickText}>{formatTime(startAt)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.timeRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.subLabel}>Bitis</Text>
                            <View style={styles.pickerGroup}>
                                <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('endDate')}>
                                    <Ionicons name="calendar-outline" size={18} color={COLOR} />
                                    <Text style={styles.pickText}>{formatDate(endAt)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerTarget('endTime')}>
                                    <Ionicons name="time-outline" size={18} color={COLOR} />
                                    <Text style={styles.pickText}>{formatTime(endAt)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Event Type & Priority */}
                <View style={styles.card}>
                    <Text style={styles.label}>Toplanti Tipi</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                        {EVENT_TYPES.map((item) => (
                            <Chip
                                key={item}
                                value={item}
                                label={EVENT_TYPE_LABELS[item]}
                                selected={eventType === item}
                                onPress={() => setEventType(item)}
                            />
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { marginTop: 16 }]}>Oncelik</Text>
                    <View style={styles.chipsWrap}>
                        {PRIORITIES.map((item) => (
                            <Chip
                                key={item}
                                value={item}
                                label={PRIORITY_LABELS[item]}
                                selected={priority === item}
                                onPress={() => setPriority(item)}
                            />
                        ))}
                    </View>
                </View>

                {/* Online/Physical Selection */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Konum & Detaylar</Text>

                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[styles.modeBtn, !isOnline && styles.modeBtnActive]}
                            onPress={() => setIsOnline(false)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="business-outline" size={18} color={!isOnline ? '#fff' : '#64748B'} />
                            <Text style={[styles.modeText, !isOnline && styles.modeTextActive]}>Fiziksel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, isOnline && styles.modeBtnActive]}
                            onPress={() => setIsOnline(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="videocam-outline" size={18} color={isOnline ? '#fff' : '#64748B'} />
                            <Text style={[styles.modeText, isOnline && styles.modeTextActive]}>Online</Text>
                        </TouchableOpacity>
                    </View>

                    {!isOnline ? (
                        <View style={{ marginTop: 16 }}>
                            <Text style={styles.subLabel}>Konum Secin</Text>
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
                                    placeholder="Konum yaziniz..."
                                    placeholderTextColor="#94A3B8"
                                    style={[styles.input, { marginTop: 12 }]}
                                />
                            )}
                        </View>
                    ) : (
                        <View style={{ marginTop: 16 }}>
                            <Text style={styles.subLabel}>Toplanti Linki</Text>
                            <View style={styles.inputWithIcon}>
                                <Ionicons name="link-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                                <TextInput
                                    value={meetingUrl}
                                    onChangeText={setMeetingUrl}
                                    placeholder="https://meet.google.com/..."
                                    placeholderTextColor="#94A3B8"
                                    style={{ flex: 1, height: '100%', color: '#0F172A' }}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                />
                            </View>
                        </View>
                    )}

                    <Text style={[styles.label, { marginTop: 16 }]}>Katilimci Sayisi (Opsiyonel)</Text>
                    <TextInput
                        value={participantCount}
                        onChangeText={setParticipantCount}
                        placeholder="Orn: 6"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                        keyboardType="number-pad"
                    />
                </View>

                {/* Reminder */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Ionicons name="notifications-outline" size={20} color={COLOR} />
                        <Text style={styles.sectionTitleNoMargin}>Hatirlatma</Text>
                    </View>
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
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                    onPress={submit}
                    disabled={submitting}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <Text style={styles.submitText}>Olusturuluyor...</Text>
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.submitText}>Toplantiyi Olustur</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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

            <Toast
                visible={toastVisible}
                type={toastType}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
        </View>
    );
}

function Chip({
    value,
    label,
    selected,
    onPress,
}: {
    value: string;
    label?: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[styles.chip, selected && styles.chipSelected]}
        >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label || value}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 20,
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 10,
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
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    form: { paddingHorizontal: 16, paddingTop: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
    sectionTitleNoMargin: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    subLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#0F172A',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        height: 48,
    },
    timeRow: { marginBottom: 12 },
    pickerGroup: { flexDirection: 'row', gap: 10 },
    pickBtn: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pickText: { fontSize: 13, fontWeight: '600', color: '#334155' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipScroll: { flexDirection: 'row', marginBottom: 4 },
    chip: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 8, // for horizontal scroll
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: COLOR,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    chipTextSelected: { color: COLOR },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 8,
    },
    modeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 8,
        borderRadius: 10,
    },
    modeBtnActive: {
        backgroundColor: COLOR,
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    modeText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    modeTextActive: { color: '#fff' },
    submitBtn: {
        backgroundColor: COLOR,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

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

            // Toplanti olusturulunca, secilen dakika kadar once otomatik hatirlatici uret.
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
                    // Toplanti olusturma basariliysa reminder hatasi akisi bozmasin.
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

            <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text style={styles.label}>Baslik</Text>
                <TextInput value={title} onChangeText={setTitle} placeholder="Orn: Sprint Planning" style={styles.input} />

                <Text style={styles.label}>Aciklama</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Toplanti notu"
                    multiline
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                />

                <Text style={styles.label}>Tarih ve Saat</Text>
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

                <Text style={styles.label}>Toplanti Tipi</Text>
                <View style={styles.chipsWrap}>
                    {EVENT_TYPES.map((item) => (
                        <Chip
                            key={item}
                            value={item}
                            label={EVENT_TYPE_LABELS[item]}
                            selected={eventType === item}
                            onPress={() => setEventType(item)}
                        />
                    ))}
                </View>

                <Text style={styles.label}>Oncelik</Text>
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

                <Text style={styles.label}>Hatirlatma</Text>
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
                        <Text style={styles.label}>Konum</Text>
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
                                style={styles.input}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <Text style={styles.label}>Toplanti Linki</Text>
                        <TextInput
                            value={meetingUrl}
                            onChangeText={setMeetingUrl}
                            placeholder="https://meet.google.com/..."
                            style={styles.input}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </>
                )}

                <Text style={styles.label}>Katilimci Sayisi (Opsiyonel)</Text>
                <TextInput
                    value={participantCount}
                    onChangeText={setParticipantCount}
                    placeholder="Orn: 6"
                    style={styles.input}
                    keyboardType="number-pad"
                />

                <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={submit} disabled={submitting}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.submitText}>{submitting ? 'Olusturuluyor...' : 'Toplantiyi Olustur'}</Text>
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
        <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label || value}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
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
});

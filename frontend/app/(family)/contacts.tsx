// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
import { contactsService } from '../../services/contacts.service';
import { familyService } from '../../services/family.service';
import type { Contact } from '../../src/models/contact.model';
import type { FamilyBirthdayResponse } from '../../src/models/family.model';

const COLOR = '#FF8A65';

const trDate = (isoDate: string) => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' });
};

const daysUntilBirthday = (birthDateIso: string) => {
    const birthDate = new Date(birthDateIso);
    if (Number.isNaN(birthDate.getTime())) return null;
    const now = new Date();
    const next = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

export default function ContactsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [birthdays, setBirthdays] = useState<FamilyBirthdayResponse[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBirthdayId, setEditingBirthdayId] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [note, setNote] = useState('');
    const [birthMonthDay, setBirthMonthDay] = useState(new Date(2000, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [contactsPickerOpen, setContactsPickerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const loadBirthdays = useCallback(async () => {
        setLoading(true);
        try {
            const [birthdaysResult, contactsResult] = await Promise.allSettled([
                familyService.getBirthdays(0, 100),
                contactsService.getAll(0, 200),
            ]);
            if (birthdaysResult.status === 'fulfilled') {
                setBirthdays(birthdaysResult.value.content || []);
            } else {
                setBirthdays([]);
            }
            if (contactsResult.status === 'fulfilled') {
                setContacts(contactsResult.value.content || []);
            } else {
                setContacts([]);
            }
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Veriler alinamadi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadBirthdays();
        }, [loadBirthdays]),
    );

    const upcomingBirthdays = useMemo(() => {
        return birthdays
            .map((b) => ({ ...b, daysLeft: daysUntilBirthday(b.birthDate) }))
            .filter((b) => b.daysLeft != null)
            .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number));
    }, [birthdays]);

    const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (event.type === 'dismissed' || !selected) return;
        const next = new Date(2000, selected.getMonth(), selected.getDate());
        setBirthMonthDay(next);
    };

    const resetForm = () => {
        setFullName('');
        setRelationship('');
        setNote('');
        setBirthMonthDay(new Date(2000, 0, 1));
        setEditingBirthdayId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const applyContactToForm = (contact: Contact) => {
        setFullName(contact.name || '');
        setRelationship(contact.relationship || '');
        if (contact.birthDate) {
            const d = new Date(contact.birthDate);
            setBirthMonthDay(new Date(2000, d.getMonth(), d.getDate()));
        }
        if (contact.notes && !note) {
            setNote(contact.notes);
        }
        setContactsPickerOpen(false);
    };

    const openEditModal = (birthday: FamilyBirthdayResponse) => {
        const d = new Date(birthday.birthDate);
        setEditingBirthdayId(birthday.id);
        setFullName(birthday.fullName || '');
        setRelationship(birthday.relationship || '');
        setNote(birthday.note || '');
        setBirthMonthDay(new Date(2000, d.getMonth(), d.getDate()));
        setModalVisible(true);
    };

    const submitBirthday = async () => {
        if (!fullName.trim()) {
            showToast('error', 'Ad soyad zorunlu.');
            return;
        }

        const day = birthMonthDay.getDate();
        const month = birthMonthDay.getMonth() + 1;
        const fixedYear = 2000; // backend LocalDate zorunlulugu icin teknik sabit yil
        const birthDateIso = `${fixedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        setSaving(true);
        try {
            const payload = {
                fullName: fullName.trim(),
                relationship: relationship.trim() || undefined,
                birthDate: birthDateIso,
                note: note.trim() || undefined,
            };

            if (editingBirthdayId) {
                await familyService.updateBirthday(editingBirthdayId, payload);
            } else {
                await familyService.createBirthday(payload);
            }
            setModalVisible(false);
            resetForm();
            showToast(
                'success',
                editingBirthdayId
                    ? 'Dogum gunu guncellendi.'
                    : 'Dogum gunu eklendi. Hatirlatici otomatik olusturuldu.',
            );
            await loadBirthdays();
        } catch (error: any) {
            showToast(
                'error',
                error?.response?.data?.message || (editingBirthdayId ? 'Dogum gunu guncellenemedi.' : 'Dogum gunu eklenemedi.'),
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteBirthday = (birthday: FamilyBirthdayResponse) => {
        Alert.alert('Kaydi sil', `${birthday.fullName} dogum gunu kaydi silinsin mi?`, [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await familyService.deleteBirthday(birthday.id);
                        showToast('success', 'Dogum gunu kaydi silindi.');
                        await loadBirthdays();
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Kayit silinemedi.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Dogum Gunleri</Text>
                    <TouchableOpacity onPress={openCreateModal} style={styles.backBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.summaryRow}>
                    <Ionicons name="gift-outline" size={24} color="#fff" />
                    <View>
                        <Text style={styles.summaryNum}>{birthdays.length} kayit</Text>
                        <Text style={styles.summarySub}>Dogum gunu hatirlaticisi</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.primaryAction} onPress={openCreateModal}>
                    <Ionicons name="gift-outline" size={16} color="#fff" />
                    <Text style={styles.primaryActionText}>Dogum Gunu Ekle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push('/(family)/members')}>
                    <Ionicons name="people-outline" size={16} color={COLOR} />
                    <Text style={styles.secondaryActionText}>Kisileri Yonet</Text>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Yaklasan Dogum Gunleri</Text>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                    </View>
                ) : upcomingBirthdays.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Kayit yok</Text>
                        <Text style={styles.emptySub}>Herhangi bir kisi icin dogum gunu ekleyebilirsin.</Text>
                    </View>
                ) : (
                    upcomingBirthdays.map((b) => (
                        <View key={b.id} style={styles.card}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {(b.fullName || '?')
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{b.fullName}</Text>
                                <Text style={styles.cardSub}>
                                    {b.relationship || 'Kisi'} | {trDate(b.birthDate)}
                                </Text>
                                <Text style={styles.daysLeft}>
                                    {(b.daysLeft as number) === 0
                                        ? 'Bugun'
                                        : `${b.daysLeft} gun kaldi`}
                                </Text>
                            </View>
                            <View style={styles.cardActions}>
                                <TouchableOpacity style={styles.iconAction} onPress={() => openEditModal(b)}>
                                    <Ionicons name="create-outline" size={16} color="#64748B" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconAction} onPress={() => deleteBirthday(b)}>
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setModalVisible(false);
                    resetForm();
                }}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>{editingBirthdayId ? 'Dogum Gunu Duzenle' : 'Dogum Gunu Ekle'}</Text>
                        {!editingBirthdayId && contacts.length > 0 && (
                            <TouchableOpacity style={styles.selectContactBtn} onPress={() => setContactsPickerOpen(true)}>
                                <Ionicons name="person-add-outline" size={16} color={COLOR} />
                                <Text style={styles.selectContactText}>Kayitli kisiden sec (opsiyonel)</Text>
                            </TouchableOpacity>
                        )}
                        <TextInput
                            placeholder="Ad Soyad"
                            value={fullName}
                            onChangeText={setFullName}
                            style={styles.input}
                        />
                        <Text style={styles.fieldLabel}>Yakinlik Derecesi</Text>
                        <View style={styles.chipRow}>
                            {['Aile', 'Arkadaş', 'İş'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.chip, relationship === type && styles.chipActive]}
                                    onPress={() => setRelationship(type)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.chipText, relationship === type && styles.chipTextActive]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.fieldLabel}>Dogum Gunu (Gun/Ay)</Text>
                        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateText}>
                                {birthMonthDay.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })}
                            </Text>
                        </TouchableOpacity>
                        <TextInput
                            placeholder="Not (opsiyonel)"
                            value={note}
                            onChangeText={setNote}
                            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.cancelText}>Vazgec</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                                disabled={saving}
                                onPress={submitBirthday}
                            >
                                <Text style={styles.saveText}>
                                    {saving ? 'Kaydediliyor...' : editingBirthdayId ? 'Guncelle' : 'Kaydet'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={contactsPickerOpen} transparent animationType="fade" onRequestClose={() => setContactsPickerOpen(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
                        <Text style={styles.modalTitle}>Kisi Sec</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {contacts.map((c) => (
                                <TouchableOpacity key={c.id} style={styles.contactPickItem} onPress={() => applyContactToForm(c)}>
                                    <Text style={styles.contactPickName}>{c.name}</Text>
                                    <Text style={styles.contactPickMeta}>
                                        {c.relationship || 'Kisi'}{c.birthDate ? ` | ${new Date(c.birthDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setContactsPickerOpen(false)}>
                            <Text style={styles.cancelText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={birthMonthDay}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
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
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, marginTop: 14 },
    summaryNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
    summarySub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
    scroll: { padding: 16, paddingBottom: 28 },
    primaryAction: {
        marginBottom: 12,
        backgroundColor: COLOR,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    primaryActionText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    secondaryAction: {
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FED7C8',
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    secondaryActionText: { color: COLOR, fontSize: 14, fontWeight: '800' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    centered: { alignItems: 'center', paddingVertical: 40 },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 999,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#B91C1C', fontSize: 13, fontWeight: '800' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    cardSub: { marginTop: 2, fontSize: 12, color: '#64748B' },
    daysLeft: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#EA580C' },
    cardActions: { gap: 8, marginLeft: 8 },
    iconAction: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
    selectContactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#FED7C8',
        backgroundColor: '#FFF7ED',
        borderRadius: 10,
        paddingVertical: 9,
        marginBottom: 8,
    },
    selectContactText: { color: '#C2410C', fontSize: 13, fontWeight: '700' },
    input: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    fieldLabel: { marginTop: 10, marginBottom: 2, fontSize: 12, fontWeight: '700', color: '#475569' },
    dateText: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
    cancelBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    saveBtn: {
        flex: 1,
        backgroundColor: COLOR,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    saveText: { fontSize: 14, fontWeight: '800', color: '#fff' },
    contactPickItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    contactPickName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    contactPickMeta: { marginTop: 2, fontSize: 12, color: '#64748B' },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    chip: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chipActive: { backgroundColor: COLOR, borderColor: COLOR },
    chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    chipTextActive: { color: '#fff' },
});
// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import type { Contact } from '../../src/models/contact.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const COLOR = '#FF8A65';

export default function ContactsScreen() {
    const router = useRouter();
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';
    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filter, setFilter] = useState<'all' | 'family'>('all');
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<Contact | null>(null);
    const [name, setName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [bloodType, setBloodType] = useState('');
    const [saving, setSaving] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const page = await contactsService.getAll(0, 200);
            setContacts(page.content || []);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Kisiler alinamadi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    const resetForm = () => {
        setEditing(null);
        setName('');
        setRelationship('');
        setPhone('');
        setEmail('');
        setNotes('');
        setBirthDate(null);
        setBloodType('');
    };

    const openCreate = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEdit = (contact: Contact) => {
        setEditing(contact);
        setName(contact.name || '');
        setRelationship(contact.relationship || '');
        setPhone(contact.phone || '');
        setEmail(contact.email || '');
        setNotes(contact.notes || '');
        setBirthDate(contact.birthDate ? new Date(contact.birthDate) : null);
        setBloodType(contact.bloodType || '');
        setModalVisible(true);
    };

    const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selected) {
            setBirthDate(selected);
        }
    };

    const submit = async () => {
        if (!name.trim()) {
            showToast('error', 'Isim zorunlu.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                relationship: relationship.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                notes: notes.trim() || undefined,
                birthDate: birthDate ? birthDate.toISOString().slice(0, 10) : undefined,
                bloodType: bloodType || undefined,
            };
            if (editing) {
                await contactsService.update(editing.id, payload);
                showToast('success', 'Kisi guncellendi.');
            } else {
                await contactsService.create(payload);
                showToast('success', 'Kisi eklendi.');
            }
            setModalVisible(false);
            resetForm();
            await load();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Kayit islemi basarisiz.');
        } finally {
            setSaving(false);
        }
    };

    const remove = (contact: Contact) => {
        Alert.alert('Kisiyi sil', `${contact.name} silinsin mi?`, [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await contactsService.delete(contact.id);
                        await load();
                        showToast('success', 'Kisi silindi.');
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
                    <Text style={styles.headerTitle}>Kisiler</Text>
                    <TouchableOpacity onPress={openCreate} style={styles.backBtn}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tümü</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtn, filter === 'family' && styles.filterBtnActive]}
                        onPress={() => setFilter('family')}
                    >
                        <Text style={[styles.filterText, filter === 'family' && styles.filterTextActive]}>Aile</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                        style={styles.birthdaysBtn}
                        onPress={() => router.push('/(family)/birthdays')}
                    >
                        <Ionicons name="gift-outline" size={16} color={COLOR} />
                        <Text style={styles.birthdaysBtnText}>Doğum Günleri</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.subText}>
                    {contacts.filter(c => filter === 'all' || c.relationship === 'Aile').length} kisi kaydi
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLOR} />
                    </View>
                ) : contacts.length === 0 ? (
                    <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
                        <Text style={[styles.emptyTitle, isDark && styles.textDark]}>Henuz kisi yok</Text>
                        <Text style={[styles.emptySub, isDark && styles.subTextDark]}>Sag ustteki + ile ekleyebilirsin.</Text>
                    </View>
                ) : (
                    contacts
                        .filter((c) => filter === 'all' || c.relationship === 'Aile')
                        .map((c) => (
                            <View key={c.id} style={[styles.card, isDark && styles.cardDark]}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(c.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.name, isDark && styles.textDark]}>{c.name}</Text>
                                    <Text style={[styles.meta, isDark && styles.subTextDark]}>{c.relationship || 'Kisi'}{c.birthDate ? ` | ${new Date(c.birthDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}{c.bloodType ? ` | 🩸${c.bloodType}` : ''}</Text>
                                </View>
                                <View style={styles.actions}>
                                    <TouchableOpacity style={[styles.iconBtn, isDark && styles.iconBtnDark]} onPress={() => openEdit(c)}>
                                        <Ionicons name="create-outline" size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconBtn} onPress={() => remove(c)}>
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                )}
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
                        <Text style={[styles.modalTitle, isDark && styles.textDark]}>{editing ? 'Kisi Duzenle' : 'Kisi Ekle'}</Text>
                        <TextInput placeholder="Isim" value={name} onChangeText={setName} style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#6B7280' : undefined} />
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Yakinlik Derecesi</Text>
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
                        <TouchableOpacity style={[styles.input, isDark && styles.inputDark]} onPress={() => setShowDatePicker(true)}>
                            <Text style={{ color: isDark ? '#E5E7EB' : '#0F172A' }}>
                                {birthDate
                                    ? birthDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
                                    : 'Dogum gunu (opsiyonel)'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <View style={[styles.datePickerContainer, isDark && styles.datePickerContainerDark]}>
                                <DateTimePicker
                                    value={birthDate || new Date(2000, 0, 1)}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    textColor={isDark ? '#E5E7EB' : '#0F172A'}
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity style={styles.datePickerDoneBtn} onPress={() => setShowDatePicker(false)}>
                                        <Text style={styles.datePickerDoneText}>Tamam</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        <TextInput placeholder="Telefon (opsiyonel)" value={phone} onChangeText={setPhone} style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#6B7280' : undefined} />
                        <TextInput placeholder="E-posta (opsiyonel)" value={email} onChangeText={setEmail} style={[styles.input, isDark && styles.inputDark]} placeholderTextColor={isDark ? '#6B7280' : undefined} />
                        <TextInput placeholder="Not (opsiyonel)" value={notes} onChangeText={setNotes} style={[styles.input, isDark && styles.inputDark, { minHeight: 72, textAlignVertical: 'top' }]} multiline placeholderTextColor={isDark ? '#6B7280' : undefined} />
                        <Text style={[styles.label, isDark && styles.subTextDark]}>Kan Grubu</Text>
                        <View style={styles.bloodRow}>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'].map((bt) => (
                                <TouchableOpacity
                                    key={bt}
                                    style={[styles.bloodChip, bloodType === bt && styles.bloodChipActive]}
                                    onPress={() => setBloodType(bloodType === bt ? '' : bt)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.bloodChipText, bloodType === bt && styles.bloodChipTextActive]}>
                                        {bt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Vazgec</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
                                <Text style={styles.saveText}>{saving ? 'Kaydediliyor...' : editing ? 'Guncelle' : 'Kaydet'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    containerDark: { backgroundColor: '#0B1220' },
    header: { backgroundColor: COLOR, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 16 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, gap: 8 },
    filterBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
    filterBtnActive: { backgroundColor: '#fff' },
    filterText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: COLOR, fontWeight: '800' },
    birthdaysBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
    birthdaysBtnText: { color: COLOR, fontSize: 13, fontWeight: '700' },
    subText: { color: 'rgba(255,255,255,0.9)', marginTop: 12, marginLeft: 20, fontWeight: '600', fontSize: 12 },
    content: { padding: 16, paddingBottom: 24 },
    centered: { paddingVertical: 40, alignItems: 'center' },
    emptyCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
    emptyCardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#B91C1C', fontSize: 12, fontWeight: '800' },
    name: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    meta: { marginTop: 2, fontSize: 12, color: '#64748B' },
    actions: { gap: 8 },
    iconBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
    iconBtnDark: { backgroundColor: '#1E293B' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
    modalSheetDark: { backgroundColor: '#111827' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
    input: { marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
    cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    cancelText: { fontSize: 14, fontWeight: '700', color: '#334155' },
    saveBtn: { flex: 1, backgroundColor: COLOR, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    saveText: { fontSize: 14, fontWeight: '800', color: '#fff' },
    label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 12, marginBottom: 8 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    chip: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    chipActive: { backgroundColor: COLOR, borderColor: COLOR },
    chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    chipTextActive: { color: '#fff' },
    bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    bloodChip: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0' },
    bloodChipActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
    bloodChipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    bloodChipTextActive: { color: '#fff' },
    datePickerContainer: { backgroundColor: '#F1F5F9', borderRadius: 12, marginTop: 8, padding: 8, overflow: 'hidden' },
    datePickerContainerDark: { backgroundColor: '#1E293B' },
    datePickerDoneBtn: { alignSelf: 'flex-end', padding: 8, marginTop: 4 },
    datePickerDoneText: { color: COLOR, fontWeight: 'bold', fontSize: 16 },
    /* Dark mode shared */
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});
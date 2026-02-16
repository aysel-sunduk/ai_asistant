import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
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
import { userApi } from '../src/api/user.api';
import type { UpdateProfileRequest, UserProfile } from '../src/models/user.model';
import { GENDER_LABELS, VISIBILITY_LABELS } from '../src/models/user.model';
import { useAuthStore } from '../src/store/auth.store';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const formatMinorToLira = (minor?: number | null): string => {
    if (minor == null) return '—';
    return `₺${(minor / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
};

export default function PersonalInfoScreen() {
    const router = useRouter();
    const setProfile = useAuthStore((s) => s.setProfile);

    const [data, setData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Partial<UserProfile>>({});

    const loadProfile = useCallback(async () => {
        try {
            const res = await userApi.getProfile();
            const profile = res.data.data;
            setData(profile);
            setForm(profile);
        } catch {
            const storeProfile = useAuthStore.getState().profile;
            if (storeProfile) {
                setData(storeProfile);
                setForm(storeProfile);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const updateField = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateMapField = (root: 'notifications' | 'onboarding' | 'interests', key: string, value: any) => {
        setForm((prev) => ({
            ...prev,
            [root]: { ...(prev[root] || {}), [key]: value },
        }));
    };

    const removeMapKey = (root: 'notifications' | 'onboarding' | 'interests', key: string) => {
        setForm((prev) => {
            const copy = { ...(prev[root] || {}) };
            delete copy[key];
            return { ...prev, [root]: copy };
        });
    };

    const handleSave = async () => {
        const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
        if (!fullName) {
            Alert.alert('Hata', 'İsim boş bırakılamaz');
            return;
        }
        setSaving(true);
        try {
            const body: UpdateProfileRequest = {
                fullName: form.fullName || fullName,
                birthDate: form.birthDate || undefined,
                gender: form.gender || undefined,
                timezone: form.timezone || undefined,
                locale: form.locale || undefined,
                profileVisibility: form.profileVisibility || undefined,
                heightCm: form.heightCm ?? undefined,
                weightKg: form.weightKg ?? undefined,
                preferredCurrency: form.preferredCurrency || undefined,
                monthlyIncomeEstimateMinor: form.monthlyIncomeEstimateMinor ?? undefined,
                interests: form.interests || undefined,
                onboarding: form.onboarding || undefined,
                notifications: form.notifications || undefined,
            };
            const res = await userApi.updateProfile(body);
            const updated = res.data.data;
            if (updated) {
                setData(updated);
                setForm(updated);
                setProfile(updated);
            }
            setIsEditing(false);
            Alert.alert('Başarılı', 'Bilgileriniz güncellendi');
        } catch (err: any) {
            Alert.alert('Hata', err?.response?.data?.message || 'Güncellenemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (data) setForm(data);
        setIsEditing(false);
    };

    const initials = form.firstName
        ? `${form.firstName.charAt(0)}${form.lastName?.charAt(0) || ''}`
        : '?';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.loadingText}>Profil yükleniyor...</Text>
            </View>
        );
    }

    const interestKeys = form.interests ? Object.keys(form.interests) : [];
    const notifKeys = form.notifications ? Object.keys(form.notifications) : [];
    const onboardKeys = form.onboarding ? Object.keys(form.onboarding) : [];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ─── Header ─── */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>
                        {!isEditing ? (
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                                <Ionicons name="create-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 40 }} />
                        )}
                    </View>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <Text style={styles.fullName}>
                            {form.fullName || `${form.firstName || ''} ${form.lastName || ''}`}
                        </Text>
                        <Text style={styles.emailSub}>{form.email}</Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* ═══ 1. HESAP ═══ */}
                    <SectionHeader icon="person-circle-outline" title="Hesap" color="#6C63FF" />
                    <View style={styles.card}>
                        <Field label="Ad Soyad" value={form.fullName} icon="person-outline"
                            editing={isEditing} onChange={(v) => updateField('fullName', v)} />
                        <Field label="E-posta" value={form.email} icon="mail-outline" locked />
                        <PickerField
                            label="Profil Görünürlüğü"
                            icon="eye-outline"
                            value={form.profileVisibility}
                            options={Object.entries(VISIBILITY_LABELS)}
                            editing={isEditing}
                            onChange={(v) => updateField('profileVisibility', v)}
                            last
                        />
                    </View>

                    {/* ═══ 2. SAĞLIK ═══ */}
                    <SectionHeader icon="heart-outline" title="Sağlık" color="#FF6B6B" />
                    <View style={styles.card}>
                        <Field label="Doğum Tarihi" value={form.birthDate} icon="calendar-outline"
                            editing={isEditing} onChange={(v) => updateField('birthDate', v)}
                            placeholder="YYYY-MM-DD" />
                        <PickerField
                            label="Cinsiyet" icon="male-female-outline" value={form.gender}
                            options={Object.entries(GENDER_LABELS)}
                            editing={isEditing} onChange={(v) => updateField('gender', v)} />
                        <Field label="Boy (cm)" value={form.heightCm?.toString()} icon="resize-outline"
                            editing={isEditing} onChange={(v) => updateField('heightCm', Number(v) || undefined)}
                            keyboard="numeric" placeholder="175" />
                        <Field label="Kilo (kg)" value={form.weightKg?.toString()} icon="barbell-outline"
                            editing={isEditing} onChange={(v) => updateField('weightKg', Number(v) || undefined)}
                            keyboard="numeric" placeholder="70" last />
                    </View>

                    {/* ═══ 3. TERCİHLER ═══ */}
                    <SectionHeader icon="settings-outline" title="Tercihler" color="#4ECDC4" />
                    <View style={styles.card}>
                        <Field label="Saat Dilimi" value={form.timezone} icon="time-outline"
                            editing={isEditing} onChange={(v) => updateField('timezone', v)}
                            placeholder="Europe/Istanbul" />
                        <Field label="Dil" value={form.locale} icon="language-outline"
                            editing={isEditing} onChange={(v) => updateField('locale', v)}
                            placeholder="tr" />
                        <Field label="Para Birimi" value={form.preferredCurrency} icon="cash-outline"
                            editing={isEditing} onChange={(v) => updateField('preferredCurrency', v)}
                            placeholder="TRY" />
                        {/* Aylık Gelir */}
                        <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.fieldLabelRow}>
                                <View style={[styles.fieldIcon, { backgroundColor: '#34D399' + '15' }]}>
                                    <Ionicons name="wallet-outline" size={16} color="#34D399" />
                                </View>
                                <Text style={styles.fieldLabel}>Aylık Gelir (tahmini)</Text>
                            </View>
                            {isEditing ? (
                                <TextInput
                                    style={styles.fieldInput}
                                    value={form.monthlyIncomeEstimateMinor != null
                                        ? (form.monthlyIncomeEstimateMinor / 100).toString() : ''}
                                    onChangeText={(v) => updateField('monthlyIncomeEstimateMinor',
                                        v ? Math.round(Number(v) * 100) : undefined)}
                                    placeholder="30000"
                                    placeholderTextColor="#C4C4C4"
                                    keyboardType="numeric"
                                />
                            ) : (
                                <Text style={styles.fieldValue}>
                                    {formatMinorToLira(form.monthlyIncomeEstimateMinor)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* ═══ 4. BİLDİRİMLER ═══ */}
                    <SectionHeader icon="notifications-outline" title="Bildirimler" color="#F59E0B" />
                    <MapSection
                        data={form.notifications}
                        color="#F59E0B"
                        emptyText="Bildirim tercihi yok"
                        editing={isEditing}
                        onAdd={(k, v) => updateMapField('notifications', k, v)}
                        onRemove={(k) => removeMapKey('notifications', k)}
                    />

                    {/* ═══ 5. KİŞİSELLEŞTİRME ═══ */}
                    <SectionHeader icon="sparkles-outline" title="Kişiselleştirme" color="#A78BFA" />
                    <View style={styles.card}>
                        {/* İlgi Alanları */}
                        <View style={styles.fieldRow}>
                            <View style={styles.fieldLabelRow}>
                                <View style={[styles.fieldIcon, { backgroundColor: '#A78BFA' + '15' }]}>
                                    <Ionicons name="heart-circle-outline" size={16} color="#A78BFA" />
                                </View>
                                <Text style={styles.fieldLabel}>İlgi Alanları</Text>
                            </View>
                            {interestKeys.length > 0 ? (
                                <View style={styles.tagsRow}>
                                    {interestKeys.map((key) => (
                                        <View key={key} style={styles.tagWrap}>
                                            <View style={styles.tag}>
                                                <Text style={styles.tagText}>{key}</Text>
                                            </View>
                                            {isEditing && (
                                                <TouchableOpacity
                                                    style={styles.tagRemove}
                                                    onPress={() => removeMapKey('interests', key)}
                                                >
                                                    <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.fieldValueEmpty}>Henüz eklenmedi</Text>
                            )}
                            {isEditing && (
                                <AddKeyButton
                                    placeholder="Yeni ilgi alanı..."
                                    onAdd={(k) => updateMapField('interests', k, {})}
                                />
                            )}
                        </View>
                        {/* Onboarding */}
                        <View style={[styles.fieldRow, { borderTopWidth: 1, borderTopColor: '#F5F5F5' }]}>
                            <View style={styles.fieldLabelRow}>
                                <View style={[styles.fieldIcon, { backgroundColor: '#4ECDC4' + '15' }]}>
                                    <Ionicons name="rocket-outline" size={16} color="#4ECDC4" />
                                </View>
                                <Text style={styles.fieldLabel}>Onboarding</Text>
                            </View>
                            {onboardKeys.length > 0 ? (
                                <View style={styles.tagsRow}>
                                    {onboardKeys.map((key) => (
                                        <View key={key} style={styles.tagWrap}>
                                            <View style={[styles.tag, { backgroundColor: '#D1FAE5' }]}>
                                                <Text style={[styles.tagText, { color: '#059669' }]}>
                                                    {key}: {JSON.stringify(form.onboarding?.[key]) ?? '—'}
                                                </Text>
                                            </View>
                                            {isEditing && (
                                                <TouchableOpacity
                                                    style={styles.tagRemove}
                                                    onPress={() => removeMapKey('onboarding', key)}
                                                >
                                                    <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={styles.fieldValueEmpty}>Onboarding verisi yok</Text>
                            )}
                        </View>
                    </View>

                    {/* ─── Actions ─── */}
                    {isEditing && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>
                                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ═══════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════

function SectionHeader({ icon, title, color }: { icon: IoniconsName; title: string; color: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={18} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        </View>
    );
}

function Field({
    label, value, icon, editing, onChange, locked, placeholder, keyboard, last,
}: {
    label: string; value?: string; icon: IoniconsName;
    editing?: boolean; onChange?: (v: string) => void; locked?: boolean;
    placeholder?: string; keyboard?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    last?: boolean;
}) {
    return (
        <View style={[styles.fieldRow, !last && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
            <View style={styles.fieldLabelRow}>
                <View style={[styles.fieldIcon, { backgroundColor: PURPLE + '12' }]}>
                    <Ionicons name={icon} size={16} color={PURPLE} />
                </View>
                <Text style={styles.fieldLabel}>{label}</Text>
                {locked && (
                    <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={10} color={GRAY} />
                    </View>
                )}
            </View>
            {editing && !locked ? (
                <TextInput
                    style={styles.fieldInput}
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder={placeholder || label}
                    placeholderTextColor="#C4C4C4"
                    keyboardType={keyboard || 'default'}
                />
            ) : (
                <Text style={styles.fieldValue}>{value || '—'}</Text>
            )}
        </View>
    );
}

function PickerField({
    label, icon, value, options, editing, onChange, last,
}: {
    label: string; icon: IoniconsName; value?: string;
    options: [string, string][]; editing?: boolean; onChange?: (v: string) => void;
    last?: boolean;
}) {
    const displayValue = options.find(([k]) => k === value)?.[1] || value || '—';
    return (
        <View style={[styles.fieldRow, !last && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
            <View style={styles.fieldLabelRow}>
                <View style={[styles.fieldIcon, { backgroundColor: PURPLE + '12' }]}>
                    <Ionicons name={icon} size={16} color={PURPLE} />
                </View>
                <Text style={styles.fieldLabel}>{label}</Text>
            </View>
            {editing ? (
                <View style={styles.pickerRow}>
                    {options.map(([key, lbl]) => (
                        <TouchableOpacity
                            key={key}
                            style={[styles.pickerChip, value === key && styles.pickerChipActive]}
                            onPress={() => onChange?.(key)}
                        >
                            <Text style={[styles.pickerChipText, value === key && styles.pickerChipTextActive]}>
                                {lbl}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <Text style={styles.fieldValue}>{displayValue}</Text>
            )}
        </View>
    );
}

function MapSection({
    data, color, emptyText, editing, onAdd, onRemove,
}: {
    data?: Record<string, any>; color: string; emptyText: string;
    editing: boolean;
    onAdd: (key: string, value: any) => void;
    onRemove: (key: string) => void;
}) {
    const keys = data ? Object.keys(data) : [];
    return (
        <View style={styles.card}>
            <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                {keys.length > 0 ? (
                    <View style={styles.tagsRow}>
                        {keys.map((key) => {
                            const val = data?.[key];
                            const display = typeof val === 'boolean'
                                ? (val ? 'Açık' : 'Kapalı')
                                : typeof val === 'object'
                                    ? JSON.stringify(val)
                                    : String(val ?? '');
                            return (
                                <View key={key} style={styles.tagWrap}>
                                    <View style={[styles.tag, { backgroundColor: color + '15' }]}>
                                        <Text style={[styles.tagText, { color }]}>{key}</Text>
                                        {display && display !== '{}' && (
                                            <Text style={[styles.tagSubText, { color: color + 'CC' }]}>
                                                {display}
                                            </Text>
                                        )}
                                    </View>
                                    {editing && (
                                        <TouchableOpacity
                                            style={styles.tagRemove}
                                            onPress={() => onRemove(key)}
                                        >
                                            <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={styles.fieldValueEmpty}>{emptyText}</Text>
                )}
                {editing && (
                    <AddKeyButton placeholder="Yeni ekle..." onAdd={(k) => onAdd(k, {})} />
                )}
            </View>
        </View>
    );
}

function AddKeyButton({ placeholder, onAdd }: { placeholder: string; onAdd: (key: string) => void }) {
    const [value, setValue] = React.useState('');
    return (
        <View style={styles.addKeyRow}>
            <TextInput
                style={styles.addKeyInput}
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor="#C4C4C4"
            />
            <TouchableOpacity
                style={[styles.addKeyBtn, !value.trim() && { opacity: 0.4 }]}
                onPress={() => { if (value.trim()) { onAdd(value.trim()); setValue(''); } }}
                disabled={!value.trim()}
            >
                <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

// ═══════════════════════════════════════
// Styles
// ═══════════════════════════════════════

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 12, color: GRAY, fontSize: 14 },

    /* Header */
    header: {
        backgroundColor: PURPLE, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3,
        shadowRadius: 16, elevation: 8, paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    editBtn: {
        width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    avatarSection: { alignItems: 'center', marginTop: 16 },
    avatarCircle: {
        width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)',
    },
    avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
    fullName: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 12 },
    emailSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

    /* Scroll */
    scroll: { padding: 20, paddingBottom: 40 },

    /* Section */
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10, marginLeft: 4,
    },
    sectionTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    /* Card */
    card: {
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },

    /* Field */
    fieldRow: { paddingHorizontal: 18, paddingVertical: 14 },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    fieldIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: GRAY, textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 },
    lockBadge: {
        width: 18, height: 18, borderRadius: 9, backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center',
    },
    fieldValue: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', paddingLeft: 36 },
    fieldValueEmpty: { fontSize: 13, color: '#C4C4C4', fontStyle: 'italic', paddingLeft: 36 },
    fieldInput: {
        fontSize: 15, fontWeight: '500', color: '#1A1A2E', backgroundColor: '#F8F9FA',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1.5, borderColor: PURPLE + '25', marginLeft: 36,
    },

    /* Picker */
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 36 },
    pickerChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
        backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#F0F0F0',
    },
    pickerChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
    pickerChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
    pickerChipTextActive: { color: '#fff' },

    /* Tags */
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 36, marginTop: 4 },
    tagWrap: { flexDirection: 'row', alignItems: 'center' },
    tag: {
        backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    tagText: { fontSize: 12, fontWeight: '600', color: PURPLE },
    tagSubText: { fontSize: 10, fontWeight: '500' },
    tagRemove: { marginLeft: 2 },

    /* Add Key */
    addKeyRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 36, marginTop: 12,
    },
    addKeyInput: {
        flex: 1, fontSize: 13, fontWeight: '500', color: '#1A1A2E', backgroundColor: '#F8F9FA',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: '#E0E0E0',
    },
    addKeyBtn: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: PURPLE,
        alignItems: 'center', justifyContent: 'center',
    },

    /* Actions */
    actions: { marginTop: 28, gap: 12 },
    saveBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: GRAY },
});

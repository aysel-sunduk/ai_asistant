import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { userApi } from '../src/api/user.api';
import type { UpdateProfileRequest, UserProfile } from '../src/models/user.model';
import { ACTIVITY_LEVEL_LABELS, GENDER_LABELS } from '../src/models/user.model';
import { useAuthStore } from '../src/store/auth.store';
import { resolveTheme, useThemeStore } from '../src/store/theme.store';
import { useColorScheme } from '../hooks/use-color-scheme';
import { healthService } from '../services/health.service';
import type { HealthGoals } from '../src/models/health.model';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

export default function HealthInfoScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const setProfile = useAuthStore((s) => s.setProfile);

    const [data, setData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Partial<UserProfile>>({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Health Goals state
    const [goals, setGoals] = useState<HealthGoals | null>(null);
    const [goalDietGoal, setGoalDietGoal] = useState<string>('MAINTAIN');
    const [favoriteFoods, setFavoriteFoods] = useState<string[]>([]);
    const [favoriteFoodInput, setFavoriteFoodInput] = useState('');

    const loadProfile = useCallback(async () => {
        try {
            const [profileRes, goalsRes] = await Promise.all([
                userApi.getProfile(),
                healthService.getGoals()
            ]);
            
            const profile = profileRes.data.data;
            setData(profile);
            setForm(profile);

            const g = goalsRes;
            setGoals(g);
            setGoalDietGoal(g.dietGoal || 'MAINTAIN');
            setFavoriteFoods(g.favoriteFoods || []);
        } catch (err: any) {
            console.error('[HealthInfo] Load error:', err?.response?.data || err?.message);
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

    const handleSave = async () => {
        setSaving(true);
        try {
            // Profil güncelleme
            const profileBody: UpdateProfileRequest = {
                birthDate: form.birthDate || undefined,
                gender: form.gender || undefined,
                heightCm: form.heightCm ?? undefined,
                weightKg: form.weightKg ?? undefined,
                activityLevel: form.activityLevel || undefined,
            };

            // Health Goals güncelleme
            const goalsUpdate = {
                waterMlTarget: goals?.waterMlTarget || 2500,
                stepsTarget: goals?.stepsTarget || 10000,
                dietGoal: goalDietGoal,
                favoriteFoods: favoriteFoods,
            };

            await Promise.all([
                userApi.updateProfile(profileBody),
                healthService.updateGoals(goalsUpdate as any)
            ]);

            await loadProfile();
            setIsEditing(false);
            Alert.alert('Başarılı', 'Sağlık bilgileriniz ve hedefleriniz güncellendi');
        } catch (err: any) {
            console.error('[HealthInfo] Save error:', err?.response?.data || err?.message);
            Alert.alert('Hata', 'Bilgiler kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const addFavoriteFood = () => {
        if (!favoriteFoodInput.trim()) return;
        if (favoriteFoods.includes(favoriteFoodInput.trim())) return;
        setFavoriteFoods([...favoriteFoods, favoriteFoodInput.trim()]);
        setFavoriteFoodInput('');
    };

    const removeFavoriteFood = (food: string) => {
        setFavoriteFoods(favoriteFoods.filter((f) => f !== food));
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            updateField('birthDate', `${year}-${month}-${day}`);
        }
    };

    // --- Anlık Hesaplamalar ---
    // VKI: boy ve kilo girildiğinde anlık hesapla
    const bmi = (form.heightCm && form.weightKg && form.heightCm > 0)
        ? Number((form.weightKg / Math.pow(form.heightCm / 100.0, 2)).toFixed(1))
        : 0;

    // Yaş: doğum tarihi girili ve mantıklıysa hesapla (10-120 arası kabul et)
    const age = (() => {
        if (!form.birthDate) return 0;
        const today = new Date();
        const birth = new Date(form.birthDate);
        if (isNaN(birth.getTime())) return 0;
        let a = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
        return (a >= 10 && a <= 120) ? a : 0; // absürt yaşları filtrele
    })();

    // Yağ Oranı: Deurenberg formülü — VKI, yaş ve cinsiyet gerekli
    const bodyFat = (bmi > 0 && age > 0 && form.gender)
        ? Math.min(60, Math.max(2, Number(
            ((1.20 * bmi) + (0.23 * age) - (10.8 * (form.gender === 'MALE' ? 1 : 0)) - 5.4).toFixed(1)
        )))
        : 0;

    const getBmiStatus = (val: number) => {
        if (val < 18.5) return { label: 'Zayıf', color: '#3ABFF8' };
        if (val < 25) return { label: 'Normal', color: '#36D399' };
        if (val < 30) return { label: 'Fazla Kilolu', color: '#FBBD23' };
        return { label: 'Obez', color: '#F87272' };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    const bmiStatus = getBmiStatus(bmi);
    const birthDateValue = form.birthDate ? new Date(form.birthDate) : new Date();

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Header duplicate fix: headerShown: false */}
            <Stack.Screen options={{ headerShown: false }} />

            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                {/* Purple Custom Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Sağlık Bilgilerini Güncelle</Text>
                        {!isEditing ? (
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                                <Ionicons name="create-outline" size={18} color="#fff" />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 40 }} />
                        )}
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* --- BMI & Body Fat Summary --- */}
                    {bmi > 0 && (
                        <View style={styles.statsLayout}>
                            <View style={[styles.statBox, { borderLeftColor: bmiStatus.color, borderLeftWidth: 4 }]}>
                                <Text style={styles.statLabelSmall}>Vücut Kitle Endeksi (VKI)</Text>
                                <View style={styles.statValueRow}>
                                    <Text style={styles.statValueBig}>{bmi}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: bmiStatus.color + '20' }]}>
                                        <Text style={[styles.statusBadgeText, { color: bmiStatus.color }]}>{bmiStatus.label}</Text>
                                    </View>
                                </View>
                            </View>

                            {bodyFat > 0 && (
                                <View style={[styles.statBox, { borderLeftColor: '#FF6B6B', borderLeftWidth: 4 }]}>
                                    <Text style={styles.statLabelSmall}>Tahmini Yağ Oranı</Text>
                                    <View style={styles.statValueRow}>
                                        <Text style={styles.statValueBig}>%{bodyFat}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={[styles.card, isDark && styles.cardDark]}>
                        <TouchableOpacity
                            disabled={!isEditing}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <View pointerEvents="none">
                                <Field label="Doğum Tarihi" value={form.birthDate} icon="calendar-outline"
                                    editing={false} color="#FF6B6B" placeholder="Seçiniz..." />
                            </View>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={birthDateValue}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        )}

                        <PickerField
                            label="Cinsiyet" icon="male-female-outline" value={form.gender}
                            options={Object.entries(GENDER_LABELS)}
                            editing={isEditing} onChange={(v: string) => updateField('gender', v)} color="#FF6B6B" />

                        <Field label="Boy (cm)" value={form.heightCm} icon="resize-outline"
                            editing={isEditing} onChange={(v: string) => updateField('heightCm', Number(v) || undefined)}
                            keyboard="numeric" placeholder="175" color="#FF6B6B" />

                        <Field label="Kilo (kg)" value={form.weightKg} icon="barbell-outline"
                            editing={isEditing} onChange={(v: string) => updateField('weightKg', Number(v) || undefined)}
                            keyboard="numeric" placeholder="70" color="#FF6B6B" />

                        <PickerField
                            label="Hareket Durumu" icon="walk-outline" value={form.activityLevel}
                            options={Object.entries(ACTIVITY_LEVEL_LABELS)}
                            editing={isEditing} onChange={(v: string) => updateField('activityLevel', v)} last color="#FF6B6B" />
                    </View>

                    <Text style={styles.sectionTitle}>Diyet ve Hedefler</Text>
                    <View style={[styles.card, isDark && styles.cardDark, { marginBottom: 20 }]}>
                        <PickerField
                            label="Diyet Hedefi" icon="restaurant-outline" value={goalDietGoal}
                            options={[
                                ['LOSE_WEIGHT', 'Kilo Ver'],
                                ['MAINTAIN', 'Kiloyu Koru'],
                                ['GAIN_WEIGHT', 'Kilo Al'],
                                ['MUSCLE_GAIN', 'Kas Kazanımı'],
                                ['HEALTHY_LIVING', 'Sağlıklı Yaşam'],
                                ['ATHLETIC_PERFORMANCE', 'Atletik Performans']
                            ]}
                            editing={isEditing} onChange={(v: string) => setGoalDietGoal(v)} color="#FFB347" />

                        <View style={styles.fieldRow}>
                            <View style={styles.fieldLabelRow}>
                                <View style={[styles.fieldIcon, { backgroundColor: '#FFB34715' }]}>
                                    <Ionicons name="heart-outline" size={16} color="#FFB347" />
                                </View>
                                <Text style={styles.fieldLabel}>Favori Yemekler</Text>
                            </View>
                            
                            {isEditing ? (
                                <>
                                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, marginLeft: 36 }}>
                                        <TextInput 
                                            style={[styles.fieldInput, { flex: 1, marginLeft: 0 }]} 
                                            placeholder="Yemek ekle..." 
                                            value={favoriteFoodInput} 
                                            onChangeText={setFavoriteFoodInput}
                                            onSubmitEditing={addFavoriteFood}
                                        />
                                        <TouchableOpacity 
                                            style={{ backgroundColor: '#FFB347', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' }} 
                                            onPress={addFavoriteFood}
                                        >
                                            <Ionicons name="add" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 36 }}>
                                        {favoriteFoods.map((food, idx) => (
                                            <TouchableOpacity key={idx} style={styles.favChip} onPress={() => removeFavoriteFood(food)}>
                                                <Text style={styles.favChipText}>{food}</Text>
                                                <Ionicons name="close-circle" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 36 }}>
                                    {favoriteFoods.length > 0 ? favoriteFoods.map((food, idx) => (
                                        <View key={idx} style={[styles.favChip, { backgroundColor: '#FFB34720' }]}>
                                            <Text style={[styles.favChipText, { color: '#FFB347' }]}>{food}</Text>
                                        </View>
                                    )) : <Text style={styles.fieldValue}>Favori yemek yok</Text>}
                                </View>
                            )}
                        </View>
                    </View>

                    {isEditing && (
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                                <Text style={styles.cancelBtnText}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

function Field({ label, value, icon, editing, onChange, placeholder, keyboard, last, color }: any) {
    const displayValue = (value === null || value === undefined) ? '' : String(value);

    return (
        <View style={[styles.fieldRow, !last && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
            <View style={styles.fieldLabelRow}>
                <View style={[styles.fieldIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={16} color={color} />
                </View>
                <Text style={styles.fieldLabel}>{label}</Text>
            </View>
            {editing ? (
                <TextInput
                    style={styles.fieldInput}
                    value={displayValue}
                    onChangeText={onChange}
                    placeholder={placeholder || label}
                    placeholderTextColor="#C4C4C4"
                    keyboardType={keyboard || 'default'}
                />
            ) : (
                <Text style={styles.fieldValue}>{displayValue || '—'}</Text>
            )}
        </View>
    );
}

function PickerField({ label, icon, value, options, editing, onChange, last, color }: any) {
    const displayValue = options.find(([k]: any) => k === value)?.[1] || value || '—';
    return (
        <View style={[styles.fieldRow, !last && { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }]}>
            <View style={styles.fieldLabelRow}>
                <View style={[styles.fieldIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={16} color={color} />
                </View>
                <Text style={styles.fieldLabel}>{label}</Text>
            </View>
            {editing ? (
                <View style={styles.pickerRow}>
                    {options.map(([key, lbl]: any) => (
                        <TouchableOpacity
                            key={key}
                            style={[styles.pickerChip, value === key && { backgroundColor: color, borderColor: color }]}
                            onPress={() => onChange?.(key)}
                        >
                            <Text style={[styles.pickerChipText, value === key && { color: '#fff' }]}>{lbl}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <Text style={styles.fieldValue}>{displayValue}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: GRAY },
    header: { backgroundColor: PURPLE, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    editBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
    scroll: { padding: 20 },

    /* Stats Layout */
    statsLayout: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
    statLabelSmall: { fontSize: 10, fontWeight: '700', color: GRAY, textTransform: 'uppercase', marginBottom: 4 },
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statValueBig: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },

    card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 2 },
    fieldRow: { paddingHorizontal: 18, paddingVertical: 14 },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    fieldIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: GRAY, textTransform: 'uppercase' },
    fieldValue: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', paddingLeft: 36 },
    fieldInput: { fontSize: 15, fontWeight: '500', color: '#1A1A2E', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#EEE', marginLeft: 36 },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 36 },
    pickerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#F0F0F0' },
    pickerChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
    actions: { marginTop: 24, gap: 12 },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 14 },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    cancelBtn: { alignItems: 'center', paddingVertical: 12 },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: GRAY },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: GRAY, textTransform: 'uppercase', marginTop: 24, marginBottom: 8, marginLeft: 4 },
    favChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFB347', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    favChipText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

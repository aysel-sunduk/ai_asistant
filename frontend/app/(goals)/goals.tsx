// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGoals } from '../../src/hooks/useGoals';
import type { Goal } from '../../src/models/goal.model';

const COLOR = '#FFD93D';
const DARK = '#B8860B';
const PRESET_CATEGORIES = [
    { value: 'saglik', label: 'Sağlık' },
    { value: 'finans', label: 'Finans' },
    { value: 'egitim', label: 'Eğitim' },
    { value: 'kariyer', label: 'Kariyer' },
    { value: 'kisisel', label: 'Kişisel' },
] as const;
const OTHER_CATEGORY = 'other';

export default function GoalsScreen() {
    const router = useRouter();
    const { goals, isLoading, fetchGoals, createGoal, deleteGoal } = useGoals();
    const [refreshing, setRefreshing] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('kisisel');
    const [customCategoryInput, setCustomCategoryInput] = useState('');
    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchGoals();
        }, [fetchGoals]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchGoals();
        setRefreshing(false);
    };

    const activeGoals = useMemo(() => goals.filter((g) => !g.isCompleted), [goals]);
    const overallProgress = useMemo(() => {
        if (goals.length === 0) return 0;
        const total = goals.reduce((sum, g) => sum + (g.progressPct || 0), 0);
        return Math.round(total / goals.length);
    }, [goals]);

    const handleCreate = async () => {
        if (creating) {
            return;
        }

        const title = titleInput.trim();
        if (title.length < 3) {
            Alert.alert('Hedef eklenemedi', 'Hedef basligi en az 3 karakter olmalidir.');
            return;
        }
        if (selectedCategory === OTHER_CATEGORY && customCategoryInput.trim().length < 2) {
            Alert.alert('Hedef eklenemedi', 'Diger kategori icin en az 2 karakter giriniz.');
            return;
        }

        const resolvedCategory =
            selectedCategory === OTHER_CATEGORY ? customCategoryInput.trim().toLowerCase() : selectedCategory;
        const targetDateIso = targetDate
            ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
            : undefined;

        setCreating(true);
        try {
            await createGoal({
                title,
                description: descriptionInput.trim() || undefined,
                category: resolvedCategory || undefined,
                targetDate: targetDateIso,
                progressPct: 0,
                isCompleted: false,
                milestones: [],
            });
            setTitleInput('');
            setDescriptionInput('');
            setSelectedCategory('kisisel');
            setCustomCategoryInput('');
            setTargetDate(null);
            setShowCreateForm(false);
            await fetchGoals();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Hedef olusturulurken bir hata olustu.';
            Alert.alert('Hedef eklenemedi', message);
        } finally {
            setCreating(false);
        }
    };

    const openDetail = (goal: Goal) => {
        router.push({ pathname: '/(goals)/goal-detail', params: { id: goal.id } });
    };

    const handleDelete = async (goalId: string) => {
        Alert.alert('Hedefi sil', 'Bu hedef kalici olarak silinecek. Emin misin?', [
            { text: 'Vazgec', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    await deleteGoal(goalId);
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
                        <Ionicons name="chevron-back" size={24} color={DARK} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: DARK }]}>Hedefler</Text>
                    <TouchableOpacity onPress={() => setShowCreateForm((prev) => !prev)} style={styles.backBtn} disabled={creating}>
                        <Ionicons name={showCreateForm ? 'close' : 'add'} size={24} color={DARK} />
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryNum}>{activeGoals.length}</Text>
                    <Text style={styles.summaryLabel}>aktif hedef</Text>
                    <View style={styles.overallBar}>
                        <View style={[styles.overallFill, { width: `${overallProgress}%` }]} />
                    </View>
                    <Text style={styles.overallText}>Genel ilerleme: %{overallProgress}</Text>
                </View>
            </View>

            <Modal visible={showCreateForm} transparent animationType="slide" onRequestClose={() => setShowCreateForm(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.createTitle}>Yeni Hedef</Text>
                            <TouchableOpacity onPress={() => setShowCreateForm(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={18} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Hedef adi (zorunlu)"
                            value={titleInput}
                            onChangeText={setTitleInput}
                            returnKeyType="next"
                        />
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Aciklama"
                            value={descriptionInput}
                            onChangeText={setDescriptionInput}
                            multiline
                        />

                        <Text style={styles.formLabel}>Kategori</Text>
                        <View style={styles.categoryWrap}>
                            {PRESET_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    style={[styles.categoryChip, selectedCategory === cat.value && styles.categoryChipActive]}
                                    onPress={() => setSelectedCategory(cat.value)}
                                >
                                    <Text style={[styles.categoryChipText, selectedCategory === cat.value && styles.categoryChipTextActive]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.categoryChip, selectedCategory === OTHER_CATEGORY && styles.categoryChipActive]}
                                onPress={() => setSelectedCategory(OTHER_CATEGORY)}
                            >
                                    <Text style={[styles.categoryChipText, selectedCategory === OTHER_CATEGORY && styles.categoryChipTextActive]}>
                                    Diğer
                                    </Text>
                            </TouchableOpacity>
                        </View>

                        {selectedCategory === OTHER_CATEGORY && (
                            <TextInput
                                style={styles.input}
                                placeholder="Diger kategori adini yaz"
                                value={customCategoryInput}
                                onChangeText={setCustomCategoryInput}
                            />
                        )}

                        <Text style={styles.formLabel}>Hedef tarihi</Text>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={16} color="#334155" />
                            <Text style={styles.dateBtnText}>
                                {targetDate
                                    ? `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
                                    : 'Tarih sec'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={targetDate || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(_, selected) => {
                                    if (Platform.OS !== 'ios') {
                                        setShowDatePicker(false);
                                    }
                                    if (selected) {
                                        setTargetDate(selected);
                                    }
                                }}
                            />
                        )}

                        <View style={styles.createActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateForm(false)} disabled={creating}>
                                <Text style={styles.cancelBtnText}>Vazgec</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addBtn, (titleInput.trim().length < 3 || creating) && styles.addBtnDisabled]}
                                onPress={handleCreate}
                                disabled={titleInput.trim().length < 3 || creating}
                            >
                                <Text style={styles.addBtnText}>{creating ? 'Kaydediliyor...' : 'Kaydet'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {isLoading ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="small" color={DARK} />
                    </View>
                ) : goals.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Hedef bulunmuyor</Text>
                        <Text style={styles.emptySub}>Yukaridan yeni hedef ekleyebilirsin.</Text>
                    </View>
                ) : (
                    goals.map((g) => (
                        <TouchableOpacity key={g.id} style={styles.card} activeOpacity={0.85} onPress={() => openDetail(g)}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconBox}>
                                    <Ionicons name={g.isCompleted ? 'checkmark-done-outline' : 'flag-outline'} size={20} color={DARK} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{g.title}</Text>
                                <Text style={styles.cardSub}>Hedef: {g.targetDate || 'Belirtilmedi'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(g.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${g.progressPct}%` }]} />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
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
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    summaryCard: { alignItems: 'center', marginTop: 12 },
    summaryNum: { fontSize: 36, fontWeight: '900', color: DARK },
    summaryLabel: { fontSize: 13, color: DARK + 'AA', marginTop: -2 },
    overallBar: { width: '70%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)', marginTop: 12 },
    overallFill: { height: 6, borderRadius: 3, backgroundColor: DARK },
    overallText: { fontSize: 11, color: DARK + 'CC', marginTop: 6 },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    createTitle: { fontSize: 14, fontWeight: '800', color: '#78350F', marginBottom: 4 },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700', marginBottom: 6, marginTop: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    multilineInput: { minHeight: 70, textAlignVertical: 'top' },
    categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    categoryChip: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    categoryChipActive: {
        borderColor: '#B8860B',
        backgroundColor: '#FEF3C7',
    },
    categoryChipText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
    categoryChipTextActive: { color: '#92400E' },
    dateBtn: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
    },
    dateBtnText: { color: '#334155', fontSize: 14, fontWeight: '600' },
    createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 2 },
    cancelBtn: {
        borderRadius: 12,
        paddingHorizontal: 14,
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
    },
    cancelBtnText: { color: '#334155', fontSize: 13, fontWeight: '800' },
    addBtn: {
        backgroundColor: DARK,
        borderRadius: 12,
        paddingHorizontal: 14,
        justifyContent: 'center',
    },
    addBtnDisabled: { opacity: 0.5 },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    scroll: { padding: 20, paddingBottom: 40 },
    centerState: { paddingVertical: 20, alignItems: 'center' },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
    },
    emptyTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#6B7280' },

    card: {
        backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLOR + '30', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    cardSub: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    deleteBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBar: { height: 6, borderRadius: 3, backgroundColor: '#F0F0F0', marginTop: 14 },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: COLOR },
});
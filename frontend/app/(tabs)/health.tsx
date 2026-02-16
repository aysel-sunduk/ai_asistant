import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import type {
    DailySummaryData,
    ExerciseData,
    HealthLog,
    HealthLogType,
    MealData,
    WaterData,
} from '../../src/models/health.model';
import { useHealthStore } from '../../src/store/health.store';

const PURPLE = '#6C63FF';
const PURPLE_LIGHT = '#8B83FF';
const RED = '#FF6B6B';
const GREEN = '#4ECDC4';
const ORANGE = '#FFB347';
const BLUE = '#5B9BD5';
const GRAY = '#9BA1A6';
const BORDER = '#F0F0F0';



// ─── Mock veri üretici ───
const uuid = () => Math.random().toString(36).substring(2, 10);
const todayStr = new Date().toISOString().split('T')[0];

// ─── Tip tanımları ───
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface QuickAction {
    key: HealthLogType;
    label: string;
    icon: IoniconsName;
    color: string;
    bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    { key: 'water', label: 'Su', icon: 'water', color: BLUE, bg: BLUE + '15' },
    { key: 'exercise', label: 'Egzersiz', icon: 'fitness', color: GREEN, bg: GREEN + '15' },
    { key: 'meal', label: 'Öğün', icon: 'restaurant', color: ORANGE, bg: ORANGE + '15' },
    { key: 'daily_summary', label: 'Günlük', icon: 'sunny', color: PURPLE, bg: PURPLE + '15' },
];

const MOOD_EMOJIS: Record<string, string> = {
    great: '😄',
    good: '🙂',
    neutral: '😐',
    bad: '😕',
    terrible: '😢',
};

const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle',
    dinner: 'Akşam',
    snack: 'Atıştırma',
};

export default function HealthTabScreen() {
    const { logs, addLog, removeLog } = useHealthStore();
    const [activeModal, setActiveModal] = useState<HealthLogType | null>(null);

    // Bugünün logları
    const todayLogs = logs.filter((l) => l.logDate === todayStr);
    const waterLogs = todayLogs.filter((l) => l.logType === 'water');
    const exerciseLogs = todayLogs.filter((l) => l.logType === 'exercise');
    const mealLogs = todayLogs.filter((l) => l.logType === 'meal');
    const summaryLog = todayLogs.find((l) => l.logType === 'daily_summary');

    // Su toplamı
    const totalWater = waterLogs.reduce((sum, l) => sum + ((l.data as WaterData).amount_ml || 0), 0);
    const waterGoal = 2500; // ml

    // Egzersiz toplamı
    const totalExerciseMin = exerciseLogs.reduce(
        (sum, l) => sum + ((l.data as ExerciseData).duration_min || 0),
        0,
    );
    const totalCalories = exerciseLogs.reduce(
        (sum, l) => sum + ((l.data as ExerciseData).calories_burned || 0),
        0,
    );

    // ─── Su ekleme ───
    const [waterAmount, setWaterAmount] = useState('250');

    const handleAddWater = () => {
        const ml = parseInt(waterAmount, 10);
        if (!ml || ml <= 0) return Alert.alert('Hata', 'Geçerli bir miktar girin');
        const log: HealthLog = {
            id: uuid(),
            userId: '',
            logType: 'water',
            logDate: todayStr,
            data: { amount_ml: ml } as WaterData,
            loggedAt: new Date().toISOString(),
        };
        addLog(log);
        setActiveModal(null);
        setWaterAmount('250');
    };

    // ─── Egzersiz ekleme ───
    const [exActivity, setExActivity] = useState('');
    const [exDuration, setExDuration] = useState('');
    const [exCalories, setExCalories] = useState('');

    const handleAddExercise = () => {
        if (!exActivity.trim()) return Alert.alert('Hata', 'Aktivite adı girin');
        if (!exDuration) return Alert.alert('Hata', 'Süre girin');
        const log: HealthLog = {
            id: uuid(),
            userId: '',
            logType: 'exercise',
            logDate: todayStr,
            data: {
                activity: exActivity.trim(),
                duration_min: parseInt(exDuration, 10),
                calories_burned: exCalories ? parseInt(exCalories, 10) : undefined,
            } as ExerciseData,
            loggedAt: new Date().toISOString(),
        };
        addLog(log);
        setActiveModal(null);
        setExActivity('');
        setExDuration('');
        setExCalories('');
    };

    // ─── Öğün ekleme ───
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
    const [mealDesc, setMealDesc] = useState('');
    const [mealCal, setMealCal] = useState('');

    const handleAddMeal = () => {
        if (!mealDesc.trim()) return Alert.alert('Hata', 'Yemek açıklaması girin');
        const log: HealthLog = {
            id: uuid(),
            userId: '',
            logType: 'meal',
            logDate: todayStr,
            data: {
                meal_type: mealType,
                description: mealDesc.trim(),
                calories: mealCal ? parseInt(mealCal, 10) : undefined,
            } as MealData,
            loggedAt: new Date().toISOString(),
        };
        addLog(log);
        setActiveModal(null);
        setMealDesc('');
        setMealCal('');
    };

    // ─── Günlük Özet ekleme ───
    const [mood, setMood] = useState<DailySummaryData['mood']>('good');
    const [sleepHours, setSleepHours] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [steps, setSteps] = useState('');

    const handleAddSummary = () => {
        const log: HealthLog = {
            id: uuid(),
            userId: '',
            logType: 'daily_summary',
            logDate: todayStr,
            data: {
                mood,
                sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
                weight_kg: weightKg ? parseFloat(weightKg) : undefined,
                steps: steps ? parseInt(steps, 10) : undefined,
            } as DailySummaryData,
            loggedAt: new Date().toISOString(),
        };
        addLog(log);
        setActiveModal(null);
    };

    // ─── Progress bar ───
    const waterPct = Math.min((totalWater / waterGoal) * 100, 100);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Sağlık</Text>
                        <Text style={styles.headerSubtitle}>Bugünkü durumun</Text>
                    </View>
                    <View style={styles.headerDateBadge}>
                        <Text style={styles.headerDate}>
                            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </Text>
                    </View>
                </View>

                {/* Günlük Özet Kartı */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryGradient}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Ionicons name="water" size={22} color="#fff" />
                                <Text style={styles.summaryValue}>{totalWater} ml</Text>
                                <Text style={styles.summaryLabel}>Su</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Ionicons name="fitness" size={22} color="#fff" />
                                <Text style={styles.summaryValue}>{totalExerciseMin} dk</Text>
                                <Text style={styles.summaryLabel}>Egzersiz</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Ionicons name="flame" size={22} color="#fff" />
                                <Text style={styles.summaryValue}>{totalCalories}</Text>
                                <Text style={styles.summaryLabel}>Kalori</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Ionicons name="restaurant" size={22} color="#fff" />
                                <Text style={styles.summaryValue}>{mealLogs.length}</Text>
                                <Text style={styles.summaryLabel}>Öğün</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Su Takibi Kartı */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconCircle, { backgroundColor: BLUE + '15' }]}>
                            <Ionicons name="water" size={20} color={BLUE} />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Su Takibi</Text>
                            <Text style={styles.cardSubtitle}>
                                {totalWater} / {waterGoal} ml
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.addMiniBtn, { backgroundColor: BLUE + '15' }]}
                            onPress={() => setActiveModal('water')}
                        >
                            <Ionicons name="add" size={20} color={BLUE} />
                        </TouchableOpacity>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${waterPct}%`, backgroundColor: BLUE }]} />
                    </View>
                    <Text style={styles.progressText}>
                        {waterPct >= 100 ? '🎉 Hedefe ulaştın!' : `Hedefe ${waterGoal - totalWater} ml kaldı`}
                    </Text>
                </View>

                {/* Hızlı Ekle Butonları */}
                <Text style={styles.sectionTitle}>Hızlı Ekle</Text>
                <View style={styles.quickRow}>
                    {QUICK_ACTIONS.map((a) => (
                        <TouchableOpacity
                            key={a.key}
                            style={styles.quickCard}
                            activeOpacity={0.7}
                            onPress={() => setActiveModal(a.key)}
                        >
                            <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                                <Ionicons name={a.icon} size={24} color={a.color} />
                            </View>
                            <Text style={styles.quickLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Egzersiz Listesi */}
                {exerciseLogs.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Egzersizler</Text>
                        {exerciseLogs.map((log) => {
                            const d = log.data as ExerciseData;
                            return (
                                <View key={log.id} style={styles.listItem}>
                                    <View style={[styles.listDot, { backgroundColor: GREEN }]} />
                                    <View style={styles.listContent}>
                                        <Text style={styles.listTitle}>{d.activity}</Text>
                                        <Text style={styles.listSub}>
                                            {d.duration_min} dk{d.calories_burned ? ` · ${d.calories_burned} kcal` : ''}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeLog(log.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#D0D0D0" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* Öğün Listesi */}
                {mealLogs.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Öğünler</Text>
                        {mealLogs.map((log) => {
                            const d = log.data as MealData;
                            return (
                                <View key={log.id} style={styles.listItem}>
                                    <View style={[styles.listDot, { backgroundColor: ORANGE }]} />
                                    <View style={styles.listContent}>
                                        <Text style={styles.listTitle}>
                                            {MEAL_LABELS[d.meal_type]} — {d.description}
                                        </Text>
                                        {d.calories ? (
                                            <Text style={styles.listSub}>{d.calories} kcal</Text>
                                        ) : null}
                                    </View>
                                    <TouchableOpacity onPress={() => removeLog(log.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#D0D0D0" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </>
                )}

                {/* Günlük Özet */}
                {summaryLog && (
                    <>
                        <Text style={styles.sectionTitle}>Günlük Özet</Text>
                        <View style={styles.dailyCard}>
                            {(() => {
                                const d = summaryLog.data as DailySummaryData;
                                return (
                                    <View style={styles.dailyRow}>
                                        {d.mood && (
                                            <View style={styles.dailyItem}>
                                                <Text style={styles.dailyEmoji}>{MOOD_EMOJIS[d.mood]}</Text>
                                                <Text style={styles.dailyLabel}>Ruh Hali</Text>
                                            </View>
                                        )}
                                        {d.sleep_hours != null && (
                                            <View style={styles.dailyItem}>
                                                <Text style={styles.dailyValue}>{d.sleep_hours}s</Text>
                                                <Text style={styles.dailyLabel}>Uyku</Text>
                                            </View>
                                        )}
                                        {d.weight_kg != null && (
                                            <View style={styles.dailyItem}>
                                                <Text style={styles.dailyValue}>{d.weight_kg}kg</Text>
                                                <Text style={styles.dailyLabel}>Kilo</Text>
                                            </View>
                                        )}
                                        {d.steps != null && (
                                            <View style={styles.dailyItem}>
                                                <Text style={styles.dailyValue}>{d.steps}</Text>
                                                <Text style={styles.dailyLabel}>Adım</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })()}
                        </View>
                    </>
                )}

                {/* Boş durum */}
                {todayLogs.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="heart-outline" size={44} color="#E0E0E0" />
                        <Text style={styles.emptyText}>Henüz kayıt yok</Text>
                        <Text style={styles.emptySubtext}>
                            Yukarıdaki butonlardan sağlık verini eklemeye başla
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* ─── MODALS ─── */}

            {/* Su Modal */}
            <Modal visible={activeModal === 'water'} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            <Ionicons name="water" size={20} color={BLUE} /> Su Ekle
                        </Text>
                        <View style={styles.quickWaterRow}>
                            {[200, 250, 330, 500].map((ml) => (
                                <TouchableOpacity
                                    key={ml}
                                    style={[
                                        styles.quickWaterBtn,
                                        waterAmount === String(ml) && { backgroundColor: BLUE, borderColor: BLUE },
                                    ]}
                                    onPress={() => setWaterAmount(String(ml))}
                                >
                                    <Text
                                        style={[
                                            styles.quickWaterText,
                                            waterAmount === String(ml) && { color: '#fff' },
                                        ]}
                                    >
                                        {ml} ml
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Miktar (ml)"
                            placeholderTextColor="#C4C4C4"
                            keyboardType="numeric"
                            value={waterAmount}
                            onChangeText={setWaterAmount}
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                                <Text style={styles.modalCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: BLUE }]} onPress={handleAddWater}>
                                <Text style={styles.modalSaveText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Egzersiz Modal */}
            <Modal visible={activeModal === 'exercise'} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            <Ionicons name="fitness" size={20} color={GREEN} /> Egzersiz Ekle
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Aktivite (ör. Koşu, Yoga)"
                            placeholderTextColor="#C4C4C4"
                            value={exActivity}
                            onChangeText={setExActivity}
                        />
                        <View style={styles.modalInputRow}>
                            <TextInput
                                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                                placeholder="Süre (dk)"
                                placeholderTextColor="#C4C4C4"
                                keyboardType="numeric"
                                value={exDuration}
                                onChangeText={setExDuration}
                            />
                            <TextInput
                                style={[styles.modalInput, { flex: 1 }]}
                                placeholder="Kalori (isteğe bağlı)"
                                placeholderTextColor="#C4C4C4"
                                keyboardType="numeric"
                                value={exCalories}
                                onChangeText={setExCalories}
                            />
                        </View>
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                                <Text style={styles.modalCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: GREEN }]} onPress={handleAddExercise}>
                                <Text style={styles.modalSaveText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Öğün Modal */}
            <Modal visible={activeModal === 'meal'} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            <Ionicons name="restaurant" size={20} color={ORANGE} /> Öğün Ekle
                        </Text>
                        <View style={styles.mealTypeRow}>
                            {(
                                [
                                    { key: 'breakfast', label: 'Kahvaltı' },
                                    { key: 'lunch', label: 'Öğle' },
                                    { key: 'dinner', label: 'Akşam' },
                                    { key: 'snack', label: 'Atıştırma' },
                                ] as const
                            ).map((m) => (
                                <TouchableOpacity
                                    key={m.key}
                                    style={[
                                        styles.mealTypeBtn,
                                        mealType === m.key && {
                                            backgroundColor: ORANGE,
                                            borderColor: ORANGE,
                                        },
                                    ]}
                                    onPress={() => setMealType(m.key)}
                                >
                                    <Text
                                        style={[
                                            styles.mealTypeText,
                                            mealType === m.key && { color: '#fff' },
                                        ]}
                                    >
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ne yedin?"
                            placeholderTextColor="#C4C4C4"
                            value={mealDesc}
                            onChangeText={setMealDesc}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Kalori (isteğe bağlı)"
                            placeholderTextColor="#C4C4C4"
                            keyboardType="numeric"
                            value={mealCal}
                            onChangeText={setMealCal}
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                                <Text style={styles.modalCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: ORANGE }]} onPress={handleAddMeal}>
                                <Text style={styles.modalSaveText}>Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Günlük Özet Modal */}
            <Modal visible={activeModal === 'daily_summary'} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            <Ionicons name="sunny" size={20} color={PURPLE} /> Günlük Özet
                        </Text>
                        <Text style={styles.modalLabel}>Ruh Hali</Text>
                        <View style={styles.moodRow}>
                            {(Object.keys(MOOD_EMOJIS) as DailySummaryData['mood'][]).map((m) =>
                                m ? (
                                    <TouchableOpacity
                                        key={m}
                                        style={[
                                            styles.moodBtn,
                                            mood === m && {
                                                backgroundColor: PURPLE + '20',
                                                borderColor: PURPLE,
                                            },
                                        ]}
                                        onPress={() => setMood(m)}
                                    >
                                        <Text style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</Text>
                                    </TouchableOpacity>
                                ) : null,
                            )}
                        </View>
                        <View style={styles.modalInputRow}>
                            <TextInput
                                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                                placeholder="Uyku (saat)"
                                placeholderTextColor="#C4C4C4"
                                keyboardType="numeric"
                                value={sleepHours}
                                onChangeText={setSleepHours}
                            />
                            <TextInput
                                style={[styles.modalInput, { flex: 1 }]}
                                placeholder="Kilo (kg)"
                                placeholderTextColor="#C4C4C4"
                                keyboardType="numeric"
                                value={weightKg}
                                onChangeText={setWeightKg}
                            />
                        </View>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Adım sayısı"
                            placeholderTextColor="#C4C4C4"
                            keyboardType="numeric"
                            value={steps}
                            onChangeText={setSteps}
                        />
                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                                <Text style={styles.modalCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: PURPLE }]} onPress={handleAddSummary}>
                                <Text style={styles.modalSaveText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 44,
        paddingBottom: 30,
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
    headerSubtitle: { fontSize: 14, color: GRAY, marginTop: 2 },
    headerDateBadge: {
        backgroundColor: PURPLE + '12',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    headerDate: { fontSize: 13, fontWeight: '700', color: PURPLE },

    /* Özet Kart */
    summaryCard: { marginBottom: 24 },
    summaryGradient: {
        backgroundColor: RED,
        borderRadius: 22,
        padding: 20,
        shadowColor: RED,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center', gap: 4 },
    summaryValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
    summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    /* Su Kart */
    card: {
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardHeaderText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    cardSubtitle: { fontSize: 12, color: GRAY, marginTop: 2 },
    addMiniBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E8E8E8',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: { fontSize: 12, color: GRAY, marginTop: 8, textAlign: 'center' },

    /* Bölüm Başlığı */
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 14,
    },

    /* Hızlı Ekle */
    quickRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    quickCard: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        gap: 8,
    },
    quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    quickLabel: { fontSize: 12, fontWeight: '600', color: '#1A1A2E' },

    /* Liste */
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    listDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    listSub: { fontSize: 12, color: GRAY, marginTop: 2 },

    /* Günlük Özet Kart */
    dailyCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        padding: 20,
        marginBottom: 24,
    },
    dailyRow: { flexDirection: 'row', justifyContent: 'space-around' },
    dailyItem: { alignItems: 'center', gap: 4 },
    dailyEmoji: { fontSize: 28 },
    dailyValue: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
    dailyLabel: { fontSize: 11, color: GRAY, fontWeight: '500' },

    /* Boş */
    emptyCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 18,
        padding: 32,
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    emptyText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
    emptySubtext: { fontSize: 13, color: GRAY, textAlign: 'center' },

    /* ─── Modal ─── */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 18,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 18 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 8 },
    modalInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 14 : 12,
        fontSize: 15,
        color: '#1A1A2E',
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    modalInputRow: { flexDirection: 'row' },
    modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: GRAY },
    modalSaveBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    /* Su hızlı seçenekler */
    quickWaterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    quickWaterBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: BORDER,
        alignItems: 'center',
    },
    quickWaterText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

    /* Öğün tipi */
    mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    mealTypeBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: BORDER,
        alignItems: 'center',
    },
    mealTypeText: { fontSize: 11, fontWeight: '600', color: '#1A1A2E' },

    /* Mood */
    moodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    moodBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: BORDER,
        alignItems: 'center',
    },
    moodEmoji: { fontSize: 24 },
});

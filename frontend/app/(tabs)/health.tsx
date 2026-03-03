// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    View,
} from 'react-native';
import { healthDeviceService } from '../../services/health-device.service';
import { healthService } from '../../services/health.service';
import { useHealth } from '../../src/hooks/useHealth';
import type {
    ActiveCaloriesData,
    DailySummaryData,
    DistanceData,
    ExerciseData,
    HealthGoals,
    HealthLogType,
    HeartRateData,
    MealData,
    StepsData,
    WaterData,
} from '../../src/models/health.model';

const PURPLE = '#6C63FF';
const RED = '#FF6B6B';
const GREEN = '#4ECDC4';
const ORANGE = '#FFB347';
const BLUE = '#5B9BD5';
const GRAY = '#9BA1A6';
const BORDER = '#F0F0F0';

const todayStr = new Date().toISOString().split('T')[0];

type Period = 'daily' | 'weekly' | 'monthly';
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface QuickAction {
    key: HealthLogType;
    label: string;
    icon: IoniconsName;
    color: string;
    bg: string;
}

interface LocalGoals {
    waterMlTarget: number;
    stepsTarget: number;
}

const DEFAULT_GOALS: LocalGoals = {
    waterMlTarget: 2500,
    stepsTarget: 10000,
};

const QUICK_ACTIONS: QuickAction[] = [
    { key: 'water', label: 'Su', icon: 'water', color: BLUE, bg: BLUE + '15' },
    { key: 'exercise', label: 'Egzersiz', icon: 'fitness', color: GREEN, bg: GREEN + '15' },
    { key: 'meal', label: 'Ogun', icon: 'restaurant', color: ORANGE, bg: ORANGE + '15' },
    { key: 'daily_summary', label: 'Gunluk', icon: 'sunny', color: PURPLE, bg: PURPLE + '15' },
];

const MOOD_EMOJIS: Record<string, string> = {
    great: ':-)',
    good: ':)',
    neutral: ':|',
    bad: ':(',
    terrible: 'T_T',
};

const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Kahvalti',
    lunch: 'Ogle',
    dinner: 'Aksam',
    snack: 'Atistirma',
};

function parseLogDate(value: string): Date {
    const parts = value.split('-').map((x) => parseInt(x, 10));
    return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
}

function daysBetweenInclusive(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

function startOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const d = new Date(date);
    d.setDate(date.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function inRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
}

export default function HealthTabScreen() {
    const { logs, isLoading, fetchLogs, createLog, deleteLog } = useHealth();
    const didInitRef = useRef(false);

    const [period, setPeriod] = useState<Period>('daily');
    const [activeModal, setActiveModal] = useState<HealthLogType | null>(null);
    const [goalEditType, setGoalEditType] = useState<'water' | 'steps' | null>(null);
    const [isDeviceSyncing, setIsDeviceSyncing] = useState(false);

    const [goals, setGoals] = useState<LocalGoals>(DEFAULT_GOALS);
    const [goalWaterInput, setGoalWaterInput] = useState(String(DEFAULT_GOALS.waterMlTarget));
    const [goalStepsInput, setGoalStepsInput] = useState(String(DEFAULT_GOALS.stepsTarget));

    useEffect(() => {
        if (didInitRef.current) {
            return;
        }
        didInitRef.current = true;

        const run = async () => {
            try {
                const backendGoals: HealthGoals = await healthService.getGoals();
                const mapped = {
                    waterMlTarget: backendGoals.waterMlTarget,
                    stepsTarget: backendGoals.stepsTarget,
                };
                setGoals(mapped);
                setGoalWaterInput(String(mapped.waterMlTarget));
                setGoalStepsInput(String(mapped.stepsTarget));
            } catch {
                // Keep defaults if goals cannot be loaded.
            }

            try {
                await fetchLogs();
            } catch {
                // Avoid noisy startup popup on transient auth/network issues.
            }
        };
        void run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const range = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        if (period === 'daily') {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return { start, end: now, days: 1 };
        }
        if (period === 'weekly') {
            const start = startOfWeek(now);
            return { start, end: now, days: daysBetweenInclusive(start, now) };
        }
        const start = startOfMonth(now);
        return { start, end: now, days: daysBetweenInclusive(start, now) };
    }, [period]);

    const periodLogs = useMemo(() => {
        return logs.filter((log) => {
            const d = parseLogDate(log.logDate);
            return inRange(d, range.start, range.end);
        });
    }, [logs, range]);

    const waterLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'water'), [periodLogs]);
    const exerciseLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'exercise'), [periodLogs]);
    const mealLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'meal'), [periodLogs]);
    const summaryLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'daily_summary'), [periodLogs]);
    const stepsLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'steps'), [periodLogs]);
    const activeCaloriesLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'active_calories'), [periodLogs]);

    const totalWater = waterLogs.reduce((sum, l) => sum + (Number((l.data as WaterData).amount_ml) || 0), 0);
    const totalExerciseMin = exerciseLogs.reduce((sum, l) => sum + (Number((l.data as ExerciseData).duration_min) || 0), 0);
    const totalCaloriesFromExercise = exerciseLogs.reduce((sum, l) => sum + (Number((l.data as ExerciseData).calories_burned) || 0), 0);
    const totalCaloriesFromDevice = activeCaloriesLogs.reduce((sum, l) => sum + (Number((l.data as ActiveCaloriesData).kcal) || 0), 0);
    const totalCalories = totalCaloriesFromExercise + totalCaloriesFromDevice;
    const totalStepsFromStepsLogs = stepsLogs.reduce((sum, l) => sum + (Number((l.data as StepsData).count) || 0), 0);
    const totalStepsFromSummary = summaryLogs.reduce((sum, l) => sum + (Number((l.data as DailySummaryData).steps) || 0), 0);
    const totalSteps = totalStepsFromStepsLogs > 0 ? totalStepsFromStepsLogs : totalStepsFromSummary;

    const waterGoalForPeriod = goals.waterMlTarget * range.days;
    const stepsGoalForPeriod = goals.stepsTarget * range.days;

    const waterPct = Math.min((totalWater / Math.max(waterGoalForPeriod, 1)) * 100, 100);
    const stepsPct = Math.min((totalSteps / Math.max(stepsGoalForPeriod, 1)) * 100, 100);

    const [waterAmount, setWaterAmount] = useState('250');
    const [exActivity, setExActivity] = useState('');
    const [exDuration, setExDuration] = useState('');
    const [exCalories, setExCalories] = useState('');
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
    const [mealDesc, setMealDesc] = useState('');
    const [mealCal, setMealCal] = useState('');
    const [mood, setMood] = useState<DailySummaryData['mood']>('good');
    const [sleepHours, setSleepHours] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [steps, setSteps] = useState('');

    const saveGoals = async () => {
        const nextWater = parseInt(goalWaterInput, 10);
        const nextSteps = parseInt(goalStepsInput, 10);
        if (!nextWater || nextWater <= 0 || !nextSteps || nextSteps <= 0) {
            Alert.alert('Hata', 'Hedefler pozitif sayi olmali.');
            return;
        }
        try {
            const saved = await healthService.updateGoals({
                waterMlTarget: nextWater,
                stepsTarget: nextSteps,
            });
            const mapped = {
                waterMlTarget: saved.waterMlTarget,
                stepsTarget: saved.stepsTarget,
            };
            setGoals(mapped);
            setGoalWaterInput(String(mapped.waterMlTarget));
            setGoalStepsInput(String(mapped.stepsTarget));
            setGoalEditType(null);
        } catch {
            Alert.alert('Hata', 'Hedefler kaydedilemedi.');
        }
    };

    const handleSyncDeviceData = async () => {
        try {
            setIsDeviceSyncing(true);
            const snapshot = await healthDeviceService.syncToday();
            // Debug: cihazdan gelen anlık özet
            // (geçici) Senkron sırasında hangi veri olduğu burada görülecek
            // örn: { stepsCount: 1234, distanceKm: 2.3, ... }
            // Bu log, sunucuya hangi kayıtların gönderildiğini anlamamıza yardımcı olur.
            // Kısa ve tek satırlık.
            // eslint-disable-next-line no-console
            console.log('Device snapshot:', snapshot);
            let inserted = 0;

            if (snapshot.stepsCount > 0) {
                const created = await createLog({
                    logType: 'steps',
                    logDate: todayStr,
                    source: snapshot.source,
                    externalRecordId: `${snapshot.source}-${todayStr}-steps`,
                    data: { count: snapshot.stepsCount } as StepsData,
                });
                // eslint-disable-next-line no-console
                console.log('createLog(steps) =>', created);
                if (created && (created as any).id) inserted += 1;
            }

            if (snapshot.distanceKm > 0) {
                const created = await createLog({
                    logType: 'distance',
                    logDate: todayStr,
                    source: snapshot.source,
                    externalRecordId: `${snapshot.source}-${todayStr}-distance`,
                    data: { kilometers: snapshot.distanceKm } as DistanceData,
                });
                // eslint-disable-next-line no-console
                console.log('createLog(distance) =>', created);
                if (created && (created as any).id) inserted += 1;
            }

            if (snapshot.activeKcal > 0) {
                const created = await createLog({
                    logType: 'active_calories',
                    logDate: todayStr,
                    source: snapshot.source,
                    externalRecordId: `${snapshot.source}-${todayStr}-active-kcal`,
                    data: { kcal: snapshot.activeKcal } as ActiveCaloriesData,
                });
                // eslint-disable-next-line no-console
                console.log('createLog(active_calories) =>', created);
                if (created && (created as any).id) inserted += 1;
            }

            if (snapshot.avgHeartRate > 0) {
                const created = await createLog({
                    logType: 'heart_rate',
                    logDate: todayStr,
                    source: snapshot.source,
                    externalRecordId: `${snapshot.source}-${todayStr}-heart-rate`,
                    data: { bpm: snapshot.avgHeartRate } as HeartRateData,
                });
                // eslint-disable-next-line no-console
                console.log('createLog(heart_rate) =>', created);
                if (created && (created as any).id) inserted += 1;
            }

            await fetchLogs();
            // Debug: senkron sonucu
            // eslint-disable-next-line no-console
            console.log('Device sync completed, inserted:', inserted);
            Alert.alert('Senkron tamam', inserted > 0 ? 'Cihaz verileri guncellendi.' : 'Bugun icin yeni veri bulunamadi.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Cihaz verileri alinamadi.';
            Alert.alert('Senkron hatasi', message);
        } finally {
            setIsDeviceSyncing(false);
        }
    };

    const handleAddWater = async () => {
        try {
            const ml = parseInt(waterAmount, 10);
            if (!ml || ml <= 0) return Alert.alert('Hata', 'Gecerli bir miktar girin');
            await createLog({
                logType: 'water',
                logDate: todayStr,
                source: 'manual',
                data: { amount_ml: ml } as WaterData,
            });
            setActiveModal(null);
            setWaterAmount('250');
        } catch {
            Alert.alert('Hata', 'Su kaydi eklenemedi.');
        }
    };

    const handleAddExercise = async () => {
        try {
            if (!exActivity.trim()) return Alert.alert('Hata', 'Aktivite adi girin');
            if (!exDuration) return Alert.alert('Hata', 'Sure girin');
            await createLog({
                logType: 'exercise',
                logDate: todayStr,
                source: 'manual',
                data: {
                    activity: exActivity.trim(),
                    duration_min: parseInt(exDuration, 10),
                    calories_burned: exCalories ? parseInt(exCalories, 10) : undefined,
                } as ExerciseData,
            });
            setActiveModal(null);
            setExActivity('');
            setExDuration('');
            setExCalories('');
        } catch {
            Alert.alert('Hata', 'Egzersiz kaydi eklenemedi.');
        }
    };

    const handleAddMeal = async () => {
        try {
            if (!mealDesc.trim()) return Alert.alert('Hata', 'Yemek aciklamasi girin');
            await createLog({
                logType: 'meal',
                logDate: todayStr,
                source: 'manual',
                data: {
                    meal_type: mealType,
                    description: mealDesc.trim(),
                    calories: mealCal ? parseInt(mealCal, 10) : undefined,
                } as MealData,
            });
            setActiveModal(null);
            setMealDesc('');
            setMealCal('');
        } catch {
            Alert.alert('Hata', 'Ogun kaydi eklenemedi.');
        }
    };

    const handleAddSummary = async () => {
        try {
            await createLog({
                logType: 'daily_summary',
                logDate: todayStr,
                source: 'manual',
                data: {
                    mood,
                    sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
                    weight_kg: weightKg ? parseFloat(weightKg) : undefined,
                    steps: steps ? parseInt(steps, 10) : undefined,
                } as DailySummaryData,
            });
            setActiveModal(null);
        } catch {
            Alert.alert('Hata', 'Gunluk ozet kaydedilemedi.');
        }
    };

    const handleDeleteLog = async (id: string) => {
        try {
            await deleteLog(id);
        } catch {
            Alert.alert('Hata', 'Kayit silinemedi.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Saglik</Text>
                        <Text style={styles.headerSubtitle}>Durum Ozeti</Text>
                    </View>
                    <TouchableOpacity style={styles.headerDateBadge} onPress={() => void handleSyncDeviceData()} disabled={isDeviceSyncing}>
                        <Text style={styles.headerDate}>{isDeviceSyncing ? 'Senkron...' : 'Cihazdan Senkronize Et'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.periodRow}>
                    {([
                        { key: 'daily', label: 'Gunluk' },
                        { key: 'weekly', label: 'Haftalik' },
                        { key: 'monthly', label: 'Aylik' },
                    ] as const).map((p) => (
                        <TouchableOpacity key={p.key} style={[styles.periodBtn, period === p.key && styles.periodBtnActive]} onPress={() => setPeriod(p.key)}>
                            <Text style={[styles.periodBtnText, period === p.key && styles.periodBtnTextActive]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

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
                                <Ionicons name="walk" size={22} color="#fff" />
                                <Text style={styles.summaryValue}>{totalSteps}</Text>
                                <Text style={styles.summaryLabel}>Adim</Text>
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
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconCircle, { backgroundColor: BLUE + '15' }]}>
                            <Ionicons name="water" size={20} color={BLUE} />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Su Hedefi</Text>
                            <Text style={styles.cardSubtitle}>{totalWater} / {waterGoalForPeriod} ml</Text>
                        </View>
                        <View style={styles.cardHeaderActions}>
                            <TouchableOpacity style={[styles.addMiniBtn, { backgroundColor: BLUE + '15' }]} onPress={() => setGoalEditType('water')}>
                                <Ionicons name="create-outline" size={18} color={BLUE} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.addMiniBtn, { backgroundColor: BLUE + '15' }]} onPress={() => setActiveModal('water')}>
                                <Ionicons name="add" size={20} color={BLUE} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${waterPct}%`, backgroundColor: BLUE }]} /></View>
                    <Text style={styles.progressText}>{waterPct >= 100 ? 'Hedefe ulastin.' : `Kalan ${Math.max(waterGoalForPeriod - totalWater, 0)} ml`}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIconCircle, { backgroundColor: GREEN + '15' }]}>
                            <Ionicons name="walk" size={20} color={GREEN} />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Adim Hedefi</Text>
                            <Text style={styles.cardSubtitle}>{totalSteps} / {stepsGoalForPeriod}</Text>
                        </View>
                        <View style={styles.cardHeaderActions}>
                            <TouchableOpacity style={[styles.addMiniBtn, { backgroundColor: GREEN + '15' }]} onPress={() => setGoalEditType('steps')}>
                                <Ionicons name="create-outline" size={18} color={GREEN} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${stepsPct}%`, backgroundColor: GREEN }]} /></View>
                    <Text style={styles.progressText}>{stepsPct >= 100 ? 'Hedefe ulastin.' : `Kalan ${Math.max(stepsGoalForPeriod - totalSteps, 0)} adim`}</Text>
                </View>

                <Text style={styles.sectionTitle}>Hizli Ekle</Text>
                <View style={styles.quickRow}>
                    {QUICK_ACTIONS.map((a) => (
                        <TouchableOpacity key={a.key} style={styles.quickCard} onPress={() => setActiveModal(a.key)}>
                            <View style={[styles.quickIcon, { backgroundColor: a.bg }]}>
                                <Ionicons name={a.icon} size={24} color={a.color} />
                            </View>
                            <Text style={styles.quickLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

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
                                        <Text style={styles.listSub}>{d.duration_min} dk{d.calories_burned ? ` · ${d.calories_burned} kcal` : ''}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => void handleDeleteLog(log.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#D0D0D0" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </>
                )}

                {mealLogs.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Ogunler</Text>
                        {mealLogs.map((log) => {
                            const d = log.data as MealData;
                            return (
                                <View key={log.id} style={styles.listItem}>
                                    <View style={[styles.listDot, { backgroundColor: ORANGE }]} />
                                    <View style={styles.listContent}>
                                        <Text style={styles.listTitle}>{MEAL_LABELS[d.meal_type]} - {d.description}</Text>
                                        {d.calories ? <Text style={styles.listSub}>{d.calories} kcal</Text> : null}
                                    </View>
                                    <TouchableOpacity onPress={() => void handleDeleteLog(log.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#D0D0D0" />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </>
                )}

                {!isLoading && periodLogs.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="heart-outline" size={44} color="#E0E0E0" />
                        <Text style={styles.emptyText}>Kayit yok</Text>
                        <Text style={styles.emptySubtext}>Veri eklemek icin hizli ekle kutularini kullan.</Text>
                    </View>
                )}
            </ScrollView>

            <Modal visible={goalEditType !== null} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>{goalEditType === 'steps' ? 'Adim Hedefini Duzenle' : 'Su Hedefini Duzenle'}</Text>
                    {goalEditType !== 'steps' ? (
                        <>
                            <Text style={styles.modalFieldLabel}>Gunluk su hedefi (ml)</Text>
                            <TextInput style={styles.modalInput} placeholder="Gunluk su hedefi (ml)" keyboardType="numeric" value={goalWaterInput} onChangeText={setGoalWaterInput} />
                        </>
                    ) : null}
                    {goalEditType !== 'water' ? (
                        <>
                            <Text style={styles.modalFieldLabel}>Gunluk adim hedefi</Text>
                            <TextInput style={styles.modalInput} placeholder="Gunluk adim hedefi" keyboardType="numeric" value={goalStepsInput} onChangeText={setGoalStepsInput} />
                        </>
                    ) : null}
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setGoalEditType(null)}><Text style={styles.modalCancelText}>Iptal</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: PURPLE }]} onPress={() => void saveGoals()}><Text style={styles.modalSaveText}>Kaydet</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            <Modal visible={activeModal === 'water'} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}><Ionicons name="water" size={20} color={BLUE} /> Su Ekle</Text>
                    <TextInput style={styles.modalInput} placeholder="Miktar (ml)" keyboardType="numeric" value={waterAmount} onChangeText={setWaterAmount} />
                    <View style={styles.inlineInfoRow}>
                        <Text style={styles.inlineInfoText}>Gunluk su hedefi: {goals.waterMlTarget} ml</Text>
                        <TouchableOpacity
                            style={styles.inlineLinkBtn}
                            onPress={() => {
                                setActiveModal(null);
                                setGoalEditType('water');
                            }}
                        >
                            <Text style={styles.inlineLinkText}>Duzenle</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}><Text style={styles.modalCancelText}>Iptal</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: BLUE }]} onPress={handleAddWater}><Text style={styles.modalSaveText}>Ekle</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            <Modal visible={activeModal === 'exercise'} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}><Ionicons name="fitness" size={20} color={GREEN} /> Egzersiz Ekle</Text>
                    <Text style={styles.modalFieldLabel}>Aktivite Adi</Text>
                    <TextInput style={styles.modalInput} placeholder="Ornek: Yuruyus, Kosma, Yoga" value={exActivity} onChangeText={setExActivity} />
                    <View style={styles.modalInputRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.modalFieldLabel}>Sure (dk)</Text>
                            <TextInput style={styles.modalInput} placeholder="30" keyboardType="numeric" value={exDuration} onChangeText={setExDuration} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalFieldLabel}>Kalori (opsiyonel)</Text>
                            <TextInput style={styles.modalInput} placeholder="250" keyboardType="numeric" value={exCalories} onChangeText={setExCalories} />
                        </View>
                    </View>
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}><Text style={styles.modalCancelText}>Iptal</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: GREEN }]} onPress={handleAddExercise}><Text style={styles.modalSaveText}>Ekle</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            <Modal visible={activeModal === 'meal'} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}><Ionicons name="restaurant" size={20} color={ORANGE} /> Ogun Ekle</Text>
                    <Text style={styles.modalFieldLabel}>Ogun Tipi</Text>
                    <View style={styles.mealTypeRow}>
                        {([
                            { key: 'breakfast', label: 'Kahvalti' },
                            { key: 'lunch', label: 'Ogle' },
                            { key: 'dinner', label: 'Aksam' },
                            { key: 'snack', label: 'Atistirma' },
                        ] as const).map((m) => (
                            <TouchableOpacity key={m.key} style={[styles.mealTypeBtn, mealType === m.key && { backgroundColor: ORANGE, borderColor: ORANGE }]} onPress={() => setMealType(m.key)}>
                                <Text style={[styles.mealTypeText, mealType === m.key && { color: '#fff' }]}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.modalFieldLabel}>Ne Yedin?</Text>
                    <TextInput style={styles.modalInput} placeholder="Ornek: Tavuk salata, pilav" value={mealDesc} onChangeText={setMealDesc} />
                    <Text style={styles.modalFieldLabel}>Kalori (opsiyonel)</Text>
                    <TextInput style={styles.modalInput} placeholder="Ornek: 450 kcal" keyboardType="numeric" value={mealCal} onChangeText={setMealCal} />
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}><Text style={styles.modalCancelText}>Iptal</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: ORANGE }]} onPress={handleAddMeal}><Text style={styles.modalSaveText}>Ekle</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            <Modal visible={activeModal === 'daily_summary'} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}><Ionicons name="sunny" size={20} color={PURPLE} /> Gunluk Ozet</Text>
                    <Text style={styles.modalFieldLabel}>Ruh Hali</Text>
                    <View style={styles.moodRow}>
                        {(Object.keys(MOOD_EMOJIS) as DailySummaryData['mood'][]).map((m) =>
                            m ? (
                                <TouchableOpacity key={m} style={[styles.moodBtn, mood === m && { backgroundColor: PURPLE + '20', borderColor: PURPLE }]} onPress={() => setMood(m)}>
                                    <Text style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</Text>
                                    <Text style={[styles.moodLabel, mood === m && { color: PURPLE, fontWeight: '700' }]}>
                                        {m === 'great' ? 'Harika' : m === 'good' ? 'Iyi' : m === 'neutral' ? 'Normal' : m === 'bad' ? 'Kotu' : 'Berbat'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null,
                        )}
                    </View>
                    <Text style={styles.modalFieldLabel}>Uyku Suresi</Text>
                    <TextInput style={styles.modalInput} placeholder="Ornek: 7.5 saat" keyboardType="numeric" value={sleepHours} onChangeText={setSleepHours} />
                    <Text style={styles.modalFieldLabel}>Kilo</Text>
                    <TextInput style={styles.modalInput} placeholder="Ornek: 72.5 kg" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
                    <Text style={styles.modalFieldLabel}>Adim Sayisi</Text>
                    <TextInput style={styles.modalInput} placeholder="Ornek: 8500" keyboardType="numeric" value={steps} onChangeText={setSteps} />
                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}><Text style={styles.modalCancelText}>Iptal</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: PURPLE }]} onPress={handleAddSummary}><Text style={styles.modalSaveText}>Kaydet</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 64 : 44, paddingBottom: 30 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
    headerSubtitle: { fontSize: 14, color: GRAY, marginTop: 2 },
    headerDateBadge: { backgroundColor: PURPLE + '12', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, maxWidth: 160 },
    headerDate: { fontSize: 12, fontWeight: '700', color: PURPLE, textAlign: 'center' },
    periodRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
    periodBtn: { flex: 1, backgroundColor: '#F1F2F6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    periodBtnActive: { backgroundColor: PURPLE + '20' },
    periodBtnText: { color: '#667085', fontWeight: '600' },
    periodBtnTextActive: { color: PURPLE },
    summaryCard: { marginBottom: 16 },
    summaryGradient: { backgroundColor: RED, borderRadius: 22, padding: 20, shadowColor: RED, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center', gap: 4 },
    summaryValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    card: { backgroundColor: '#F8F9FA', borderRadius: 18, padding: 18, marginBottom: 14 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cardHeaderText: { flex: 1 },
    cardHeaderActions: { flexDirection: 'row', gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    cardSubtitle: { fontSize: 12, color: GRAY, marginTop: 2 },
    addMiniBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    progressBarBg: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    progressText: { fontSize: 12, color: GRAY, marginTop: 8, textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
    quickRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    quickCard: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 16, paddingVertical: 18, alignItems: 'center', gap: 8 },
    quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    quickLabel: { fontSize: 12, fontWeight: '600', color: '#1A1A2E' },
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 14, padding: 14, marginBottom: 8 },
    listDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    listContent: { flex: 1 },
    listTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    listSub: { fontSize: 12, color: GRAY, marginTop: 2 },
    emptyCard: { backgroundColor: '#F8F9FA', borderRadius: 18, padding: 32, alignItems: 'center', gap: 8, marginTop: 8 },
    emptyText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
    emptySubtext: { fontSize: 13, color: GRAY, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 18 },
    modalFieldLabel: { fontSize: 13, fontWeight: '700', color: '#344054', marginBottom: 8 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 8 },
    modalInput: { backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 12, fontSize: 15, color: '#1A1A2E', marginBottom: 12, borderWidth: 1.5, borderColor: 'transparent' },
    modalInputRow: { flexDirection: 'row' },
    modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center' },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: GRAY },
    modalSaveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    inlineInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    inlineInfoText: { fontSize: 12, color: '#667085', fontWeight: '600' },
    inlineLinkBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: BLUE + '15' },
    inlineLinkText: { color: BLUE, fontWeight: '700', fontSize: 12 },
    mealTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    mealTypeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center' },
    mealTypeText: { fontSize: 11, fontWeight: '600', color: '#1A1A2E' },
    moodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    moodBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center' },
    moodEmoji: { fontSize: 20 },
    moodLabel: { fontSize: 10, fontWeight: '500', color: '#667085', marginTop: 2, textAlign: 'center' as const },
});
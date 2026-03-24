// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiApi } from '../../src/api/ai.api';
import apiClient from '../../src/api/client';
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

interface LocalGoals {
    waterMlTarget: number;
    stepsTarget: number;
}

const DEFAULT_GOALS: LocalGoals = {
    waterMlTarget: 2500,
    stepsTarget: 10000,
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

function HealthTabScreen() {
    const router = useRouter();
    const { logs, isLoading, fetchLogs, fetchNutrition, createLog, deleteLog } = useHealth();
    const didInitRef = useRef(false);

    const [dailyNutrition, setDailyNutrition] = useState({ totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    const [period, setPeriod] = useState<Period>('daily');
    const [activeTab, setActiveTab] = useState<'goals' | 'diet'>('goals'); // Ana sekmeler
    const [activeModal, setActiveModal] = useState<HealthLogType | null>(null);
    const [goalEditType, setGoalEditType] = useState<'water' | 'steps' | null>(null);
    const [isDeviceSyncing, setIsDeviceSyncing] = useState(false);

    // AI Yemek Analizi state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedImageUri, setAnalyzedImageUri] = useState<string | null>(null);

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
                await loadDailyNutrition();
            } catch {
                // Avoid noisy startup popup on transient auth/network issues.
            }
        };
        void run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadDailyNutrition = async () => {
        try {
            const result = await fetchNutrition(todayStr);
            setDailyNutrition(result);
        } catch {
            // Error handled in hook
        }
    };

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
    const mealLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'meal'), [periodLogs]);
    const stepsLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'steps'), [periodLogs]);
    const activeCaloriesLogs = useMemo(() => periodLogs.filter((l) => l.logType === 'active_calories'), [periodLogs]);

    const totalWater = waterLogs.reduce((sum, l) => sum + (Number((l.data as WaterData).amount_ml) || 0), 0);
    const totalCalories = activeCaloriesLogs.reduce((sum, l) => sum + (Number((l.data as ActiveCaloriesData).kcal) || 0), 0);
    const totalSteps = stepsLogs.reduce((sum, l) => sum + (Number((l.data as StepsData).count) || 0), 0);

    const waterGoalForPeriod = goals.waterMlTarget * range.days;
    const stepsGoalForPeriod = goals.stepsTarget * range.days;

    const waterPct = Math.min((totalWater / Math.max(waterGoalForPeriod, 1)) * 100, 100);
    const stepsPct = Math.min((totalSteps / Math.max(stepsGoalForPeriod, 1)) * 100, 100);

    const [waterAmount, setWaterAmount] = useState('250');
    const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
    const [mealDesc, setMealDesc] = useState('');
    const [mealCal, setMealCal] = useState('');
    const [mealProtein, setMealProtein] = useState('');
    const [mealCarbs, setMealCarbs] = useState('');
    const [mealFat, setMealFat] = useState('');

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
            await fetchLogs();
            setActiveModal(null);
            setWaterAmount('250');
        } catch {
            Alert.alert('Hata', 'Su kaydi eklenemedi.');
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
                    protein_g: mealProtein ? parseFloat(mealProtein) : undefined,
                    carbs_g: mealCarbs ? parseFloat(mealCarbs) : undefined,
                    fat_g: mealFat ? parseFloat(mealFat) : undefined,
                } as MealData,
            });
            await fetchLogs();
            setActiveModal(null);
            resetMealForm();
            void loadDailyNutrition();
        } catch {
            Alert.alert('Hata', 'Ogun kaydi eklenemedi.');
        }
    };

    const handleDeleteLog = (id: string) => {
        Alert.alert(
            'Emin misiniz?',
            'Bu öğünü silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteLog(id);
                            void loadDailyNutrition();
                            await fetchLogs();
                        } catch {
                            Alert.alert('Hata', 'Kayit silinemedi.');
                        }
                    },
                },
            ]
        );
    };

    const handlePickImage = async (useCamera: boolean) => {
        try {
            let result;
            if (useCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Izın Reddedildi', 'Kamerayı kullanmak için izin vermeniz gerekiyor.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.5,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('İzin Reddedildi', 'Galeriye erişmek için izin vermeniz gerekiyor.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.5,
                });
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                analyzeSelectedFood(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Image picker error:', error);
            Alert.alert('Hata', 'Görsel seçilemedi.');
        }
    };

    const analyzeSelectedFood = async (uri: string) => {
        setAnalyzedImageUri(uri);
        setIsAnalyzing(true);
        setActiveModal('meal'); // Modalı açıp loading gösterelim

        try {
            // FormData oluştur
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'food.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type,
            } as any);

            // Native fetch kullan — Axios, React Native'de multipart boundary'yi dogru ayarlamiyor
            const token = await AsyncStorage.getItem('accessToken');
            const baseURL = apiClient.defaults.baseURL || 'http://localhost:8080/api';
            const requestUrl = `${baseURL}/v1/ai/food/analyze`;
            console.log('[FoodAnalysis] Sending to:', requestUrl);

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('[FoodAnalysis] Error response:', response.status, errorText);
                throw new Error(`HTTP ${response.status}`);
            }

            const res = await response.json();
            console.log('[FoodAnalysis] Success:', JSON.stringify(res));

            if (res.data) {
                const analysis = res.data;
                setMealDesc(analysis.foodName || '');
                if (analysis.calories) {
                    setMealCal(Math.round(analysis.calories).toString());
                }
                if (analysis.protein) {
                    setMealProtein(Math.round(analysis.protein).toString());
                }
                if (analysis.carbs) {
                    setMealCarbs(Math.round(analysis.carbs).toString());
                }
                if (analysis.fat) {
                    setMealFat(Math.round(analysis.fat).toString());
                }
            } else {
                Alert.alert('Uyarı', 'Görsel analiz edilemedi, manuel girebilirsiniz.');
            }
        } catch (error: any) {
            console.log('Food analysis error:', error);
            Alert.alert('Analiz Hatası', 'Model veya sunucu şu an yanıt vermiyor, yemeği manuel kaydedebilirsiniz.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetMealForm = () => {
        setMealDesc('');
        setMealCal('');
        setMealProtein('');
        setMealCarbs('');
        setMealFat('');
        setAnalyzedImageUri(null);
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

                <View style={[styles.mainTabRow, { marginBottom: 16 }]}>
                    <TouchableOpacity
                        style={[styles.mainTabBtn, activeTab === 'goals' && styles.mainTabBtnActive]}
                        onPress={() => setActiveTab('goals')}
                    >
                        <Text style={[styles.mainTabBtnText, activeTab === 'goals' && styles.mainTabBtnTextActive]}>Günlük Hedef</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.mainTabBtn, activeTab === 'diet' && styles.mainTabBtnActive]}
                        onPress={() => setActiveTab('diet')}
                    >
                        <Text style={[styles.mainTabBtnText, activeTab === 'diet' && styles.mainTabBtnTextActive]}>Diyet</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'goals' ? (
                    <>
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryGradient}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="water" size={24} color="#fff" />
                                        <Text style={styles.summaryValue}>{totalWater}</Text>
                                        <Text style={styles.summaryLabel}>Su (ml)</Text>
                                        <View style={{ width: 64, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 4 }}>
                                            <View style={{ width: `${waterPct}%`, height: '100%', backgroundColor: '#fff', borderRadius: 2 }} />
                                        </View>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="walk" size={24} color="#fff" />
                                        <Text style={styles.summaryValue}>{totalSteps}</Text>
                                        <Text style={styles.summaryLabel}>Adim</Text>
                                        <View style={{ width: 64, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginTop: 4 }}>
                                            <View style={{ width: `${stepsPct}%`, height: '100%', backgroundColor: '#fff', borderRadius: 2 }} />
                                        </View>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="flame" size={24} color="#fff" />
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

                        {!isLoading && periodLogs.length === 0 && (
                            <View style={styles.emptyCard}>
                                <Ionicons name="heart-outline" size={44} color="#E0E0E0" />
                                <Text style={styles.emptyText}>Kayit yok</Text>
                                <Text style={styles.emptySubtext}>Cihazdan senkronize edebilir veya su ekleyebilirsiniz.</Text>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <View style={styles.summaryCard}>
                            <View style={[styles.summaryGradient, { backgroundColor: ORANGE }]}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="flame" size={24} color="#fff" />
                                        <Text style={styles.summaryValue}>{dailyNutrition.totalCalories}</Text>
                                        <Text style={styles.summaryLabel}>Kalori</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{dailyNutrition.totalProtein}g</Text>
                                        <Text style={styles.summaryLabel}>Protein</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{dailyNutrition.totalCarbs}g</Text>
                                        <Text style={styles.summaryLabel}>Karb</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{dailyNutrition.totalFat}g</Text>
                                        <Text style={styles.summaryLabel}>Yag</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.dietPlanLinkCard}
                            onPress={() => router.push('/(health)/diet-plan')}
                        >
                            <LinearGradient 
                                colors={['#4CAF50', '#2E7D32']} 
                                start={{x: 0, y: 0}} 
                                end={{x: 1, y: 0}}
                                style={styles.dietPlanGradient}
                            >
                                <View style={styles.dietPlanIconBg}>
                                    <Ionicons name="restaurant" size={24} color="#4CAF50" />
                                </View>
                                <View style={styles.dietPlanTextContainer}>
                                    <Text style={styles.dietPlanTitle}>Kişiselleştirilmiş Diyet Planı</Text>
                                    <Text style={styles.dietPlanSubtitle}>Hedefine uygun günlük öğünlerini gör</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.sectionTitle}>Yeni Öğün Ekle</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            <TouchableOpacity style={[styles.aiPhotoBtn, { flex: 1 }]} onPress={() => handlePickImage(true)}>
                                <Ionicons name="camera" size={20} color="#fff" />
                                <Text style={styles.aiPhotoBtnText}>Fotoğraf Çek</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.aiPhotoBtn, { flex: 1, backgroundColor: ORANGE }]} onPress={() => handlePickImage(false)}>
                                <Ionicons name="images" size={20} color="#fff" />
                                <Text style={styles.aiPhotoBtnText}>Galeriden Seç</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.addManualBtn} onPress={() => { resetMealForm(); setActiveModal('meal'); }}>
                            <Text style={styles.addManualBtnText}>+ Manuel Öğün Ekle</Text>
                        </TouchableOpacity>

                        {mealLogs.length > 0 && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.sectionTitle}>Öğünler</Text>
                                {mealLogs.map((log) => {
                                    const d = log.data as MealData;
                                    return (
                                        <View key={log.id} style={styles.listItem}>
                                            <View style={[styles.listDot, { backgroundColor: ORANGE }]} />
                                            <View style={styles.listContent}>
                                                <Text style={styles.listTitle}>{MEAL_LABELS[d.meal_type]} - {d.description}</Text>
                                                <Text style={styles.listSub}>
                                                    {d.calories ? `${d.calories} kcal` : 'Kalori yok'}
                                                    {d.protein_g || d.carbs_g || d.fat_g ? ` • ${d.protein_g || 0}g p, ${d.carbs_g || 0}g k, ${d.fat_g || 0}g y` : ''}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => void handleDeleteLog(log.id)}>
                                                <Ionicons name="trash-outline" size={18} color="#D0D0D0" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}

                {/* Remove duplicated meal maps/empty state from global layout */}
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

            <Modal visible={activeModal === 'meal'} transparent animationType="slide">
                <View style={styles.modalOverlay}><View style={styles.modalContent}><View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}><Ionicons name="restaurant" size={20} color={ORANGE} /> Ogun Ekle</Text>
                    {isAnalyzing ? (
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <ActivityIndicator size="large" color={ORANGE} />
                            <Text style={{ marginTop: 10, color: '#333' }}>Yemek fotoğrafı yapay zeka tarafından analiz ediliyor...</Text>
                        </View>
                    ) : (
                        <>
                            {analyzedImageUri && (
                                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                    <Image source={{ uri: analyzedImageUri }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                                    <Text style={{ fontSize: 12, color: GRAY, marginTop: 4 }}>Analiz edildi</Text>
                                </View>
                            )}
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

                            <Text style={styles.modalFieldLabel}>Makrolar (opsiyonel)</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>Kalori (kcal)</Text>
                                    <TextInput style={[styles.modalInput, { marginBottom: 0 }]} placeholder="Kalori" keyboardType="numeric" value={mealCal} onChangeText={setMealCal} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>Protein (g)</Text>
                                    <TextInput style={[styles.modalInput, { marginBottom: 0 }]} placeholder="Protein" keyboardType="numeric" value={mealProtein} onChangeText={setMealProtein} />
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>Karb (g)</Text>
                                    <TextInput style={[styles.modalInput, { marginBottom: 0 }]} placeholder="Karb" keyboardType="numeric" value={mealCarbs} onChangeText={setMealCarbs} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: GRAY, marginBottom: 4 }}>Yağ (g)</Text>
                                    <TextInput style={[styles.modalInput, { marginBottom: 0 }]} placeholder="Yag" keyboardType="numeric" value={mealFat} onChangeText={setMealFat} />
                                </View>
                            </View>

                            <View style={styles.modalBtnRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setActiveModal(null); setAnalyzedImageUri(null); }}><Text style={styles.modalCancelText}>Iptal</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: ORANGE }]} onPress={handleAddMeal}><Text style={styles.modalSaveText}>Ekle</Text></TouchableOpacity>
                            </View>
                        </>
                    )}
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
    mainTabRow: { flexDirection: 'row', gap: 8, backgroundColor: '#F1F2F6', borderRadius: 12, padding: 4 },
    mainTabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    mainTabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    mainTabBtnText: { fontSize: 13, fontWeight: '700', color: '#667085' },
    mainTabBtnTextActive: { color: PURPLE },
    aiPhotoBtn: { backgroundColor: '#4ECDC4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
    aiPhotoBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    addManualBtn: { backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
    addManualBtnText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
    dietPlanLinkCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    dietPlanGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    dietPlanIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dietPlanTextContainer: {
        flex: 1,
    },
    dietPlanTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dietPlanSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
    },
});

export default HealthTabScreen;
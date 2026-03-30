// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { healthService } from '../../services/health.service';
import type { DietMeal, DietPlan } from '../../src/models/health.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function DietPlanScreen() {
    const router = useRouter();
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [plan, setPlan] = useState<DietPlan | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadDietPlan = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const data = await healthService.getDietRecommendation({});
            setPlan(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Diyet planı yüklenemedi.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDietPlan();
        }, [])
    );

    const handleMealSwap = async (slot: string, recipeId: number | null) => {
        if (!plan) return;
        
        try {
            const excludedIds = plan.daily_plan.meals
                .map(m => m.recipe_id)
                .filter((id): id is number => id !== null);
            
            const newMeal: DietMeal = await healthService.mealSwap({
                slot,
                excludedRecipeIds: excludedIds,
                calorieTarget: plan.daily_plan.calorie_target,
                dietGoal: plan.daily_plan.diet_goal
            });

            const updatedMeals = plan.daily_plan.meals.map(m => 
                m.slot === slot ? newMeal : m
            );

            // Toplamları ve makroları yeniden hesapla
            const total_protein = updatedMeals.reduce((acc: number, m: DietMeal) => acc + m.protein, 0);
            const total_carbs = updatedMeals.reduce((acc: number, m: DietMeal) => acc + m.carbs, 0);
            const total_fat = updatedMeals.reduce((acc: number, m: DietMeal) => acc + m.fat, 0);
            const total_calories = updatedMeals.reduce((acc: number, m: DietMeal) => acc + m.calories, 0);

            const p_kcal = total_protein * 4;
            const c_kcal = total_carbs * 4;
            const f_kcal = total_fat * 9;
            const t_kcal = p_kcal + c_kcal + f_kcal;

            const macro_summary = {
                protein_pct: t_kcal > 0 ? Number(((p_kcal / t_kcal) * 100).toFixed(1)) : 0,
                carbs_pct: t_kcal > 0 ? Number(((c_kcal / t_kcal) * 100).toFixed(1)) : 0,
                fat_pct: t_kcal > 0 ? Number(((f_kcal / t_kcal) * 100).toFixed(1)) : 0,
            };

            setPlan({
                ...plan,
                daily_plan: {
                    ...plan.daily_plan,
                    total_calories,
                    total_protein,
                    total_carbs,
                    total_fat,
                    meals: updatedMeals,
                },
                macro_summary
            });
            
            Alert.alert('Başarılı', `${newMeal.slot_label} öğünü değiştirildi.`);
        } catch (err: any) {
            Alert.alert('Hata', 'Yemek değiştirilemedi.');
        }
    };

    const handleToggleFavorite = async (foodName: string) => {
        if (!plan) return;
        try {
            const updatedFavs = await healthService.toggleFavoriteMeal(foodName);
            setPlan({
                ...plan,
                daily_plan: {
                    ...plan.daily_plan,
                    favorite_foods: updatedFavs
                }
            });
        } catch (err: any) {
            Alert.alert('Hata', 'Favori işlemi başarısız oldu.');
        }
    };

    const renderMacroBar = (label: string, percentage: number, color: string, value: number, unit: string) => (
        <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>{label}</Text>
                <Text style={styles.macroValue}>{value.toFixed(1)}{unit} (%{percentage})</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={[styles.loadingText, isDark && styles.subTextDark]}>Diyet Planın Hazırlanıyor...</Text>
            </View>
        );
    }

    if (error && !plan) {
        return (
            <View style={[styles.errorContainer, isDark && styles.loadingContainerDark]}>
                <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
                <Text style={[styles.errorText, isDark && styles.subTextDark]}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadDietPlan()}>
                    <Text style={styles.retryText}>Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { daily_plan, macro_summary } = plan!;

    return (
        <ScrollView 
            style={[styles.container, isDark && styles.containerDark]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDietPlan(true); }} />}
        >
            <View style={[styles.header, { backgroundColor: '#4CAF50' }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerSubtitle}>Kişisel Diyet Planın</Text>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                        {daily_plan.diet_goal === 'LOSE_WEIGHT' ? 'Kilo Verme' : 
                         daily_plan.diet_goal === 'GAIN_WEIGHT' ? 'Kilo Alma' : 
                         daily_plan.diet_goal === 'MUSCLE_GAIN' ? 'Kas Kazanımı' :
                         daily_plan.diet_goal === 'HEALTHY_LIVING' ? 'Sağlıklı Yaşam' :
                         daily_plan.diet_goal === 'ATHLETIC_PERFORMANCE' ? 'Atletik Performans' : 'Formu Koruma'}
                    </Text>
                    <View style={styles.calorieBadge}>
                        <Ionicons name="flame" size={20} color="#FFEB3B" />
                        <Text style={styles.calorieText}>{daily_plan.calorie_target} kcal Hedef</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Makro Özeti */}
                <View style={[styles.card, isDark && styles.cardDark]}>
                    <Text style={[styles.cardTitle, isDark && styles.textDark]}>Besin Dağılımı (Günlük)</Text>
                    {renderMacroBar('Protein', macro_summary.protein_pct, '#6C63FF', daily_plan.total_protein, 'g')}
                    {renderMacroBar('Karbonhidrat', macro_summary.carbs_pct, '#3B82F6', daily_plan.total_carbs, 'g')}
                    {renderMacroBar('Yağ', macro_summary.fat_pct, '#F59E0B', daily_plan.total_fat, 'g')}
                    
                    <View style={[styles.totalCalorieRow, isDark && styles.totalCalorieRowDark]}>
                        <Text style={[styles.totalCalLabel, isDark && styles.textDark]}>Toplam Kalori:</Text>
                        <Text style={styles.totalCalValue}>{daily_plan.total_calories.toFixed(0)} kcal</Text>
                    </View>
                </View>

                {/* Öğünler */}
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Günün Öğünleri</Text>
                {daily_plan.meals.map((meal, index) => (
                    <View key={index} style={[styles.mealCard, isDark && styles.cardDark]}>
                        <View style={styles.mealHeader}>
                            <View style={styles.mealSlotIcon}>
                                <Ionicons 
                                    name={meal.slot === 'BREAKFAST' ? 'sunny' : meal.slot === 'DINNER' ? 'moon' : 'restaurant'} 
                                    size={20} 
                                    color="#4CAF50" 
                                />
                                <Text style={styles.mealSlotLabel}>{meal.slot_label}</Text>
                            </View>
                            <TouchableOpacity style={styles.swapBtn} onPress={() => handleMealSwap(meal.slot, meal.recipe_id)}>
                                <Ionicons name="refresh" size={18} color="#4CAF50" />
                                <Text style={styles.swapText}>Değiştir</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.mealTitleRow}>
                            <Text style={[styles.mealName, isDark && styles.textDark]}>{meal.name}</Text>
                            <TouchableOpacity onPress={() => handleToggleFavorite(meal.name)}>
                                <Ionicons 
                                    name={daily_plan.favorite_foods?.includes(meal.name) ? 'heart' : 'heart-outline'} 
                                    size={24} 
                                    color={daily_plan.favorite_foods?.includes(meal.name) ? '#E91E63' : (isDark ? '#6B7280' : '#999')} 
                                />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.mealDetails}>
                            <View style={styles.detailItem}>
                                <Ionicons name="time-outline" size={14} color={isDark ? '#6B7280' : '#666'} />
                                <Text style={[styles.detailText, isDark && styles.subTextDark]}>{meal.prep_minutes} dk</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="flame-outline" size={14} color={isDark ? '#6B7280' : '#666'} />
                                <Text style={[styles.detailText, isDark && styles.subTextDark]}>{meal.calories} kcal</Text>
                            </View>
                        </View>

                        <View style={[styles.mealMacros, isDark && styles.mealMacrosDark]}>
                            <Text style={[styles.miniMacro, isDark && styles.subTextDark]}>P: {meal.protein}g</Text>
                            <Text style={[styles.miniMacro, isDark && styles.subTextDark]}>K: {meal.carbs}g</Text>
                            <Text style={[styles.miniMacro, isDark && styles.subTextDark]}>Y: {meal.fat}g</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.regenerateBtn} onPress={() => loadDietPlan()}>
                    <View style={[styles.regenGradient, { backgroundColor: '#4CAF50' }]}>
                        <Ionicons name="shuffle" size={24} color="#fff" />
                        <Text style={styles.regenText}>Tüm Günü Yeniden Planla</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingContainerDark: { backgroundColor: '#0B1220' },
    loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { marginTop: 12, color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 20 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4CAF50', borderRadius: 25 },
    retryText: { color: '#fff', fontWeight: 'bold' },
    header: { paddingVertical: 36, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: 56 },
    backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, left: 16, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    headerContent: { alignItems: 'center' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
    headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 14 },
    calorieBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    calorieText: { color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 },
    content: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
    macroItem: { marginBottom: 14 },
    macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    macroLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    macroValue: { fontSize: 13, fontWeight: '700', color: '#334155' },
    progressBarBg: { height: 7, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    totalCalorieRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    totalCalorieRowDark: { borderTopColor: '#1F2937' },
    totalCalLabel: { fontSize: 15, fontWeight: '700', color: '#334155' },
    totalCalValue: { fontSize: 15, fontWeight: '800', color: '#4CAF50' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E', marginBottom: 12, marginTop: 4 },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    mealSlotIcon: { flexDirection: 'row', alignItems: 'center' },
    mealSlotLabel: { marginLeft: 6, fontSize: 13, fontWeight: '700', color: '#4CAF50', textTransform: 'uppercase', letterSpacing: 0.5 },
    swapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    swapText: { marginLeft: 4, fontSize: 12, color: '#4CAF50', fontWeight: '700' },
    mealName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', flex: 1 },
    mealTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    mealDetails: { flexDirection: 'row', marginBottom: 10 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14 },
    detailText: { marginLeft: 4, fontSize: 12, color: '#64748B' },
    mealMacros: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10 },
    mealMacrosDark: { backgroundColor: '#1E293B' },
    miniMacro: { fontSize: 12, color: '#475569', marginRight: 14, fontWeight: '600' },
    regenerateBtn: { marginTop: 6, borderRadius: 16, overflow: 'hidden', elevation: 3 },
    regenGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    regenText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 10 },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },

});
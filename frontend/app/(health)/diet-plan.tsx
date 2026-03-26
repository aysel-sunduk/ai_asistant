// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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

            // Planı güncelle
            setPlan({
                ...plan,
                daily_plan: {
                    ...plan.daily_plan,
                    meals: updatedMeals
                }
            });
            
            Alert.alert('Başarılı', `${newMeal.slot_label} öğünü değiştirildi.`);
        } catch (err: any) {
            Alert.alert('Hata', 'Yemek değiştirilemedi.');
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Diyet Planın Hazırlanıyor...</Text>
            </View>
        );
    }

    if (error && !plan) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
                <Text style={styles.errorText}>{error}</Text>
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
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerSubtitle}>Kişisel Diyet Planın</Text>
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                        {daily_plan.diet_goal === 'LOSE_WEIGHT' ? 'Kilo Verme' : 
                         daily_plan.diet_goal === 'GAIN_WEIGHT' ? 'Kilo Alma' : 'Formu Koruma'}
                    </Text>
                    <View style={styles.calorieBadge}>
                        <Ionicons name="flame" size={20} color="#FFEB3B" />
                        <Text style={styles.calorieText}>{daily_plan.calorie_target} kcal Hedef</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Makro Özeti */}
                <View style={[styles.card, isDark && styles.cardDark]}>
                    <Text style={[styles.cardTitle, isDark && styles.textDark]}>Besin Dağılımı (Günlük)</Text>
                    {renderMacroBar('Protein', macro_summary.protein_pct, '#FF5252', daily_plan.total_protein, 'g')}
                    {renderMacroBar('Karbonhidrat', macro_summary.carbs_pct, '#42A5F5', daily_plan.total_carbs, 'g')}
                    {renderMacroBar('Yağ', macro_summary.fat_pct, '#FFA726', daily_plan.total_fat, 'g')}
                    
                    <View style={styles.totalCalorieRow}>
                        <Text style={styles.totalCalLabel}>Toplam Kalori:</Text>
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
                        
                        <Text style={styles.mealName}>{meal.name}</Text>
                        
                        <View style={styles.mealDetails}>
                            <View style={styles.detailItem}>
                                <Ionicons name="time-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>{meal.prep_minutes} dk</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Ionicons name="flame-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>{meal.calories} kcal</Text>
                            </View>
                        </View>

                        <View style={styles.mealMacros}>
                            <Text style={styles.miniMacro}>P: {meal.protein}g</Text>
                            <Text style={styles.miniMacro}>K: {meal.carbs}g</Text>
                            <Text style={styles.miniMacro}>Y: {meal.fat}g</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.regenerateBtn} onPress={() => loadDietPlan()}>
                    <LinearGradient colors={['#4CAF50', '#388E3C']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.regenGradient}>
                        <Ionicons name="shuffle" size={24} color="#fff" />
                        <Text style={styles.regenText}>Tüm Günü Yeniden Planla</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { marginTop: 12, color: '#666', fontSize: 16, textAlign: 'center', marginBottom: 20 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#4CAF50', borderRadius: 25 },
    retryText: { color: '#fff', fontWeight: 'bold' },
    header: { paddingVertical: 40, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { alignItems: 'center' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 4 },
    headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
    calorieBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    calorieText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    content: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    macroItem: { marginBottom: 16 },
    macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    macroLabel: { fontSize: 14, color: '#666' },
    macroValue: { fontSize: 14, fontWeight: '600', color: '#333' },
    progressBarBg: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    totalCalorieRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    totalCalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalCalValue: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },
    mealCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    mealSlotIcon: { flexDirection: 'row', alignItems: 'center' },
    mealSlotLabel: { marginLeft: 6, fontSize: 14, fontWeight: 'bold', color: '#4CAF50', textTransform: 'uppercase' },
    swapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    swapText: { marginLeft: 4, fontSize: 13, color: '#4CAF50', fontWeight: '600' },
    mealName: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 10 },
    mealDetails: { flexDirection: 'row', marginBottom: 10 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
    detailText: { marginLeft: 4, fontSize: 13, color: '#666' },
    mealMacros: { flexDirection: 'row', backgroundColor: '#f8f9fa', padding: 8, borderRadius: 8 },
    miniMacro: { fontSize: 12, color: '#555', marginRight: 15, fontWeight: '500' },
    regenerateBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 3 },
    regenGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    regenText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },

});
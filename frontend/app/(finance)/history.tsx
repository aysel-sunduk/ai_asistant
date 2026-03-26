import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { familyService } from '../../services/family.service';
import type { MonthlyFinanceSummaryResponse } from '../../src/models/family.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PURPLE = '#6C63FF';
const DARK = '#1A1A2E';
const GRAY = '#9BA1A6';
const SUCCESS = '#10B981';
const DANGER = '#EF4444';

export default function FinanceHistoryScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const [history, setHistory] = useState<MonthlyFinanceSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // 0 means current month, -1 means last month, etc.
    const [monthOffset, setMonthOffset] = useState(0);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch past 12 months summary
            const data = await familyService.getFinanceHistory(12);
            setHistory(data);
        } catch (error: any) {
            Alert.alert('Hata', 'Gecmis veriler alinamadi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadHistory();
        }, [loadHistory])
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const getMonthDates = (offset: number) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() + offset);
        const year = d.getFullYear();
        const month = d.getMonth();
        const label = `${TURKISH_MONTHS[month]} ${year}`;
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return { label, prefix };
    };

    const goMonth = (direction: -1 | 1) => {
        const next = monthOffset + direction;
        // Don't go to future months
        if (next > 0) return;
        setMonthOffset(next);
    };

    // Find the data for the currently selected month
    const currentMonthData = useMemo(() => {
        const { prefix } = getMonthDates(monthOffset);
        // Financial history from backend typically starts on the 1st of the month
        // We look for a record whose startDate starts with 'YYYY-MM'
        return history.find(item => item.startDate.startsWith(prefix));
    }, [history, monthOffset]);

    const { label: currentMonthLabel } = getMonthDates(monthOffset);

    // Fallback if no data is found for this month
    const emptySummary: MonthlyFinanceSummaryResponse = {
        monthLabel: currentMonthLabel,
        startDate: '',
        endDate: '',
        income: 0,
        expense: 0,
        balance: 0,
    };

    const displayData = currentMonthData || emptySummary;

    return (
        <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={DARK} />
                    </TouchableOpacity>
                    <Text style={[styles.title, isDark && styles.textDark]}>Finansal Gecmis</Text>
                    <TouchableOpacity onPress={loadHistory} style={styles.backBtn}>
                        <Ionicons name="refresh" size={20} color={DARK} />
                    </TouchableOpacity>
                </View>

                {/* Month Navigation Row */}
                <View style={styles.monthNavRow}>
                    <TouchableOpacity onPress={() => goMonth(-1)} style={styles.monthNavBtn}>
                        <Ionicons name="chevron-back" size={20} color={PURPLE} />
                    </TouchableOpacity>
                    <Text style={styles.monthNavLabel}>{currentMonthLabel}</Text>
                    <TouchableOpacity
                        onPress={() => goMonth(1)}
                        style={[styles.monthNavBtn, monthOffset >= 0 && { opacity: 0.3 }]}
                        disabled={monthOffset >= 0}
                    >
                        <Ionicons name="chevron-forward" size={20} color={PURPLE} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={[styles.card, isDark && styles.cardDark]}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.monthLabel}>{displayData.monthLabel}</Text>
                                <TouchableOpacity
                                    style={[styles.detailBtn, !currentMonthData && { opacity: 0.5 }]}
                                    disabled={!currentMonthData}
                                    onPress={() => {
                                        if (currentMonthData) {
                                            router.push({
                                                pathname: '/(finance)/transactions',
                                                params: {
                                                    startDate: currentMonthData.startDate.toString(),
                                                    endDate: currentMonthData.endDate.toString()
                                                }
                                            });
                                        }
                                    }}
                                >
                                    <Text style={styles.detailBtnText}>Islemleri Gor</Text>
                                    <Ionicons name="chevron-forward" size={12} color={PURPLE} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.balanceBadge, { backgroundColor: displayData.balance >= 0 ? SUCCESS + '15' : DANGER + '15' }]}>
                                <Text style={[styles.balanceText, { color: displayData.balance >= 0 ? SUCCESS : DANGER }]}>
                                    {displayData.balance >= 0 ? '+' : ''}{formatCurrency(displayData.balance)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Gelir</Text>
                                <Text style={[styles.statValue, { color: SUCCESS }]}>{formatCurrency(displayData.income)}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Gider</Text>
                                <Text style={[styles.statValue, { color: DANGER }]}>{formatCurrency(displayData.expense)}</Text>
                            </View>
                        </View>
                    </View>

                    {!currentMonthData && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color={GRAY} />
                            <Text style={styles.emptyText}>Bu ay icin gecmis veri bulunamadi.</Text>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: DARK },
    
    /* Month Nav Row */
    monthNavRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 16,
        backgroundColor: '#F8F9FA',
        paddingVertical: 8,
        borderRadius: 16,
    },
    monthNavBtn: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: '#fff', 
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    monthNavLabel: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: PURPLE, 
        minWidth: 120, 
        textAlign: 'center' 
    },

    content: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthLabel: { fontSize: 18, fontWeight: '800', color: DARK },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        backgroundColor: PURPLE + '10',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    detailBtnText: {
        fontSize: 12,
        color: PURPLE,
        fontWeight: '700',
    },
    balanceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    balanceText: { fontSize: 16, fontWeight: '800' },
    cardBody: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingVertical: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: GRAY, marginBottom: 8, fontWeight: '600' },
    statValue: { fontSize: 18, fontWeight: '800' },
    statDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 12, color: GRAY, fontSize: 14 },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});

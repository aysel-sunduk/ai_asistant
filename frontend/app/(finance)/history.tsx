import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { familyService } from '../../services/family.service';
import type { MonthlyFinanceSummaryResponse } from '../../src/models/family.model';

const PURPLE = '#6C63FF';
const DARK = '#1A1A2E';
const GRAY = '#9BA1A6';
const SUCCESS = '#10B981';
const DANGER = '#EF4444';

export default function FinanceHistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<MonthlyFinanceSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(
        new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString().slice(0, 10)
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [isCustom, setIsCustom] = useState(false);

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = isCustom
                ? await familyService.getFinanceHistory(12, startDate, endDate)
                : await familyService.getFinanceHistory(12);
            setHistory(data);
        } catch (error: any) {
            Alert.alert('Hata', 'Gecmis veriler alinamadi.');
        } finally {
            setLoading(false);
        }
    }, [isCustom, startDate, endDate]);

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const renderItem = ({ item }: { item: MonthlyFinanceSummaryResponse }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.monthLabel}>{item.monthLabel}</Text>
                    <TouchableOpacity
                        style={styles.detailBtn}
                        onPress={() => router.push({
                            pathname: '/(finance)/transactions',
                            params: { startDate: item.startDate.toString(), endDate: item.endDate.toString() }
                        })}
                    >
                        <Text style={styles.detailBtnText}>Islemleri Gor</Text>
                        <Ionicons name="chevron-forward" size={12} color={PURPLE} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.balanceBadge, { backgroundColor: item.balance >= 0 ? SUCCESS + '15' : DANGER + '15' }]}>
                    <Text style={[styles.balanceText, { color: item.balance >= 0 ? SUCCESS : DANGER }]}>
                        {item.balance >= 0 ? '+' : ''}{formatCurrency(item.balance)}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Gelir</Text>
                    <Text style={[styles.statValue, { color: SUCCESS }]}>{formatCurrency(item.income)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Gider</Text>
                    <Text style={[styles.statValue, { color: DANGER }]}>{formatCurrency(item.expense)}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={DARK} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Finansal Gecmis</Text>
                    <TouchableOpacity onPress={loadHistory} style={styles.backBtn}>
                        <Ionicons name="refresh" size={20} color={DARK} />
                    </TouchableOpacity>
                </View>

                <View style={styles.filterTabs}>
                    <TouchableOpacity
                        style={[styles.tab, !isCustom && styles.tabActive]}
                        onPress={() => setIsCustom(false)}
                    >
                        <Text style={[styles.tabText, !isCustom && styles.tabTextActive]}>Standart (12 Ay)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, isCustom && styles.tabActive]}
                        onPress={() => setIsCustom(true)}
                    >
                        <Text style={[styles.tabText, isCustom && styles.tabTextActive]}>Ozel Aralik</Text>
                    </TouchableOpacity>
                </View>

                {isCustom && (
                    <View style={styles.customDateRow}>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Baslangic</Text>
                            <TextInput
                                style={styles.input}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Bitis</Text>
                            <TextInput
                                style={styles.input}
                                value={endDate}
                                onChangeText={setEndDate}
                                placeholder="YYYY-MM-DD"
                            />
                        </View>
                        <TouchableOpacity style={styles.goBtn} onPress={loadHistory}>
                            <Ionicons name="search" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.monthLabel}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle-outline" size={20} color={PURPLE} />
                            <Text style={styles.infoText}>Finansal hareketlerinizin aylik ozetleri asagida listelenmistir.</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color={GRAY} />
                            <Text style={styles.emptyText}>Henuz gecmis veri bulunamadi.</Text>
                        </View>
                    }
                />
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
    filterTabs: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: { fontSize: 13, fontWeight: '600', color: GRAY },
    tabTextActive: { color: PURPLE },
    customDateRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    inputBox: { flex: 1 },
    inputLabel: { fontSize: 10, color: GRAY, marginBottom: 4, fontWeight: '600' },
    input: {
        height: 36,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 12,
        color: DARK,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    goBtn: {
        width: 36,
        height: 36,
        backgroundColor: PURPLE,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: { padding: 20 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: PURPLE + '10',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    infoText: { fontSize: 13, color: PURPLE, flex: 1 },
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
        marginBottom: 12,
    },
    monthLabel: { fontSize: 16, fontWeight: '700', color: DARK },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    detailBtnText: {
        fontSize: 12,
        color: PURPLE,
        fontWeight: '600',
    },
    balanceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    balanceText: { fontSize: 14, fontWeight: '600' },
    cardBody: { flexDirection: 'row', alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: GRAY, marginBottom: 4 },
    statValue: { fontSize: 15, fontWeight: '700' },
    statDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9', marginHorizontal: 20 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 12, color: GRAY, fontSize: 14 },
});

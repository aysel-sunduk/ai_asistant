// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { financeService } from '../../services/finance.service';
console.log('FinanceService Debug:', financeService);
import type { CurrencyHoldingResponse, FinanceDashboardResponse, InvestmentResponse } from '../../src/models/finance.model';
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../../src/models/finance.model';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

import { formatCurrency, getInvestmentDisplayName, getPnlColor, getPnlPrefix } from '../../src/utils/finance.utils';

export default function FinanceScreen() {
    const router = useRouter();
    const [dashboard, setDashboard] = useState<FinanceDashboardResponse | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favCurrencies, setFavCurrencies] = useState<any[]>([]);
    const [favInvestments, setFavInvestments] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        try {
            console.log('Fetching dashboard and favorites...');

            // Check token validity
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                setErrorMsg("Token bulunamadı! Lütfen tekrar giriş yapın.");
                setLoading(false);
                return;
            }

            // Fetch independently to identify which one fails
            try {
                const dashRes = await financeService.getDashboard();
                setDashboard(dashRes);
                setErrorMsg(null);
            } catch (e: any) {
                console.error("Dashboard fetch failed:", e);
                // Check for rate limit specific content or status 400 from backend
                // The backend returns 400 with a message about AlphaVantage
                if (e.response?.status === 400 || (e.response?.data?.message && e.response.data.message.includes('AlphaVantage'))) {
                    setErrorMsg("Piyasa verileri şu an güncellenemiyor (Limit Aşıldı). Eski veriler gösteriliyor olabilir.");
                } else {
                    setErrorMsg(`Dashboard verisi alınamadı: ${e.response?.status || 'Bağlantı Hatası'}`);
                }
            }

            try {
                const favCurRes = await financeService.getFavorites();
                setFavCurrencies(Array.isArray(favCurRes) ? favCurRes : []);
            } catch (e: any) {
                console.error("Fav Currencies fetch failed:", e);
                // Don't block UI for this
            }

            try {
                const favInvRes = await financeService.getFavoriteInvestments();
                setFavInvestments(Array.isArray(favInvRes) ? favInvRes : []);
            } catch (e: any) {
                console.error("Fav Investments fetch failed:", e);
                // Don't block UI for this
            }

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <FinanceScreenContent
            dashboard={dashboard}
            favCurrencies={favCurrencies}
            favInvestments={favInvestments}
            refreshing={refreshing}
            onRefresh={onRefresh}
            router={router}
            errorMsg={errorMsg}
        />
    );
}

function FinanceScreenContent({ dashboard, favCurrencies, favInvestments, refreshing, onRefresh, router, errorMsg }: any) {
    const [performance, setPerformance] = useState<any>(null);

    useEffect(() => {
        financeService.getPortfolioPerformance().then(setPerformance).catch(() => { });
    }, [refreshing]);

    const totalValue = performance?.estimatedCurrentValue ?? dashboard?.totalPortfolioValue ?? 0;
    const totalCost = performance?.totalCost ?? 0;
    const pnl = performance?.unrealizedPnl ?? 0;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    const allocation = dashboard?.allocationByAssetTypePct ?? {};

    // Use passed favorites (fallback to dashboard if needed, but explicit fetch is preferred)
    const currenciesToShow = favCurrencies && favCurrencies.length > 0 ? favCurrencies : (dashboard?.favoriteCurrencies ?? []);
    // Ensure we use favInvestments if available
    const investmentsToShow = (favInvestments && favInvestments.length > 0) ? favInvestments : (dashboard?.topInvestments ?? []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── Header ─── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Finans</Text>
                        <Text style={styles.headerSubtitle}>Portföy Yönetimi</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
                            <Ionicons name="refresh" size={20} color={GRAY} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push('/(finance)/add-transaction')}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {errorMsg && (
                    <View style={{ margin: 20, padding: 10, backgroundColor: '#FECACA', borderRadius: 8 }}>
                        <Text style={{ color: '#DC2626', fontSize: 12 }}>Hata: {errorMsg}</Text>
                    </View>
                )}

                {/* ─── Portföy Kartı ─── */}
                <View style={styles.portfolioCard}>
                    <Text style={styles.portfolioLabel}>Toplam Portföy Değeri</Text>
                    <Text style={styles.portfolioValue}>{formatCurrency(totalValue)}</Text>
                    <View style={styles.portfolioChange}>
                        <Ionicons
                            name={pnl >= 0 ? 'trending-up' : 'trending-down'}
                            size={16}
                            color={pnl >= 0 ? '#A7F3D0' : '#FECACA'}
                        />
                        <Text style={[styles.portfolioChangeText, { color: pnl >= 0 ? '#A7F3D0' : '#FECACA' }]}>
                            {getPnlPrefix(pnl)}{formatCurrency(pnl)} ({getPnlPrefix(pnlPct)}{pnlPct.toFixed(1)}%)
                        </Text>
                    </View>
                    <View style={styles.portfolioSparkle}>
                        <Ionicons name="sparkles" size={40} color="rgba(255,255,255,0.08)" />
                    </View>
                </View>

                {/* ─── 3 Stat Kartları ─── */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#EDE9FE' }]}>
                            <Ionicons name="arrow-down-circle" size={18} color={PURPLE} />
                        </View>
                        <Text style={styles.statLabel}>Maliyet</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalCost)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="bar-chart" size={18} color="#34D399" />
                        </View>
                        <Text style={styles.statLabel}>Değer</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalValue)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: pnl >= 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Ionicons
                                name={pnl >= 0 ? 'arrow-up' : 'arrow-down'}
                                size={18}
                                color={getPnlColor(pnl)}
                            />
                        </View>
                        <Text style={styles.statLabel}>Kâr/Zarar</Text>
                        <Text style={[styles.statValue, { color: getPnlColor(pnl) }]}>
                            {getPnlPrefix(pnl)}{formatCurrency(pnl)}
                        </Text>
                    </View>
                </View>

                {/* ─── Dağılım ─── */}
                {Object.keys(allocation).length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Portföy Dağılımı</Text>
                        <View style={styles.allocationCard}>
                            <View style={styles.allocationBar}>
                                {Object.entries(allocation).map(([type, pct], idx) => (
                                    <View
                                        key={type}
                                        style={[
                                            styles.allocationSegment,
                                            {
                                                flex: Number(pct),
                                                backgroundColor: ASSET_TYPE_COLORS[type] || (type === "CURRENCY" ? "#22C55E" : "#9BA1A6"),
                                                borderTopLeftRadius: idx === 0 ? 6 : 0,
                                                borderBottomLeftRadius: idx === 0 ? 6 : 0,
                                                borderTopRightRadius: idx === Object.keys(allocation).length - 1 ? 6 : 0,
                                                borderBottomRightRadius: idx === Object.keys(allocation).length - 1 ? 6 : 0,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                            <View style={styles.legendRow}>
                                {Object.entries(allocation).map(([type, pct]) => (
                                    <View key={type} style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.legendDot,
                                                { backgroundColor: ASSET_TYPE_COLORS[type] || (type === "CURRENCY" ? "#22C55E" : "#9BA1A6") },
                                            ]}
                                        />
                                        <Text style={styles.legendText}>
                                            {ASSET_TYPE_LABELS[type] || (type === "CURRENCY" ? "Döviz" : type)} %{Number(pct).toFixed(0)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* ─── Yatırımlarım (Favoriler / Top) ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24 }}>
                            <Ionicons name="star" size={16} color="#F7B500" />
                            <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>Favori Yatırımlar</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(finance)/investments')}>
                            <Text style={styles.seeAllText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>

                    {investmentsToShow.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="trending-up" size={36} color="#E0E0E0" />
                            <Text style={styles.emptyText}>Henüz yatırım yok</Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => router.push('/(finance)/add-transaction')}
                            >
                                <Text style={styles.emptyBtnText}>İlk Yatırımını Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.investmentScroll}>
                            {investmentsToShow.map((inv: InvestmentResponse) => {
                                const cost = (inv.avgCostMinor || 0) / 100 * inv.quantity;
                                const invPnl = (inv.currentValue || 0) - cost;
                                return (
                                    <TouchableOpacity
                                        key={inv.id}
                                        style={styles.investmentCard}
                                        activeOpacity={0.7}
                                        onPress={() => router.push(`/(finance)/investments`)}
                                    >
                                        <View style={styles.investmentHeader}>
                                            <View
                                                style={[
                                                    styles.investmentIcon,
                                                    { backgroundColor: (ASSET_TYPE_COLORS[inv.assetType] || '#9BA1A6') + '18' },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={(ASSET_TYPE_ICONS[inv.assetType] || 'ellipsis-horizontal') as IoniconsName}
                                                    size={18}
                                                    color={ASSET_TYPE_COLORS[inv.assetType] || '#9BA1A6'}
                                                />
                                            </View>
                                        </View>
                                        <Text style={styles.investmentSymbol}>{getInvestmentDisplayName(inv.symbol, inv.assetType) || inv.symbol}</Text>

                                        <Text style={styles.investmentValue}>
                                            {formatCurrency(inv.currentValue)}
                                        </Text>
                                        <View style={styles.investmentPnl}>
                                            <Ionicons
                                                name={invPnl >= 0 ? 'caret-up' : 'caret-down'}
                                                size={12}
                                                color={getPnlColor(invPnl)}
                                            />
                                            <Text style={[styles.investmentPnlText, { color: getPnlColor(invPnl) }]}>
                                                {getPnlPrefix(invPnl)}{formatCurrency(invPnl)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                {/* ─── Döviz Kurları (Favoriler) ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24 }}>
                            <Ionicons name="star" size={16} color="#FFD93D" />
                            <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>Kur Takip Listesi</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(finance)/exchange-rates')}>
                            <Text style={styles.seeAllText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>

                    {currenciesToShow.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="star-outline" size={36} color="#E0E0E0" />
                            <Text style={styles.emptyText}>Favori kur eklenmedi</Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => router.push('/(finance)/exchange-rates')}
                            >
                                <Text style={styles.emptyBtnText}>Kur Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.currencyCard}>
                            {currenciesToShow.map((cur: any, index: number) => (
                                <View
                                    key={cur.id || index}
                                    style={[
                                        styles.currencyRow,
                                        index < favCurrencies.length - 1 && styles.currencyRowBorder,
                                    ]}
                                >
                                    <View style={styles.currencyLeft}>
                                        <View style={[styles.currencyBadge, { backgroundColor: '#FEF3C7' }]}>
                                            <Text style={[styles.currencyBadgeText, { color: '#D97706' }]}>
                                                {cur.currencyCode?.slice(0, 2) || '??'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.currencyCode}>{cur.currencyName}</Text>
                                            <Text style={styles.currencyName}>
                                                {cur.currencyCode}/{cur.baseCurrency || 'TRY'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.currencyRight}>
                                        <Text style={styles.currencyRate}>
                                            {Number(cur.rate).toFixed(4)}
                                        </Text>
                                        {cur.changeRate != null && (
                                            <View style={styles.currencyChangeRow}>
                                                <Ionicons
                                                    name={Number(cur.changeRate) >= 0 ? 'caret-up' : 'caret-down'}
                                                    size={10}
                                                    color={getPnlColor(Number(cur.changeRate))}
                                                />
                                                <Text
                                                    style={[
                                                        styles.currencyChange,
                                                        { color: getPnlColor(Number(cur.changeRate)) },
                                                    ]}
                                                >
                                                    {getPnlPrefix(Number(cur.changeRate))}{Number(cur.changeRate).toFixed(2)}%
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: {
        paddingBottom: 32,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 12, color: GRAY, fontSize: 14 },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 64 : 44,
        paddingBottom: 16,
        backgroundColor: '#F8F9FA',
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E' },
    headerSubtitle: { fontSize: 14, color: GRAY, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 10 },
    iconBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    addBtn: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center',
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },

    /* Portföy Kartı */
    portfolioCard: {
        marginHorizontal: 20, marginBottom: 20, padding: 24,
        backgroundColor: PURPLE, borderRadius: 24,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
        overflow: 'hidden', position: 'relative',
    },
    portfolioLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    portfolioValue: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 6, letterSpacing: 0.5 },
    portfolioChange: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    portfolioChangeText: { fontSize: 14, fontWeight: '600' },
    portfolioSparkle: { position: 'absolute', right: 20, top: 20, opacity: 0.5 },

    /* Stats */
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    statIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 11, color: GRAY, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
    statValue: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },

    /* Section */
    section: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, marginBottom: 14,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', paddingHorizontal: 24 },
    seeAllText: { fontSize: 14, fontWeight: '600', color: PURPLE },

    /* Allocation */
    allocationCard: {
        marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    allocationBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
    allocationSegment: { height: '100%' },
    legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 3 },
    legendText: { fontSize: 12, color: '#666', fontWeight: '500' },

    /* Investments */
    investmentScroll: { paddingLeft: 20 },
    investmentCard: {
        width: 150, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginRight: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    investmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    investmentIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    investmentType: { fontSize: 11, color: GRAY, fontWeight: '600' },
    investmentSymbol: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
    investmentValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
    investmentPnl: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    investmentPnlText: { fontSize: 12, fontWeight: '600' },

    /* Currency */
    currencyCard: {
        marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    currencyRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    currencyBadge: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#EDE9FE',
        alignItems: 'center', justifyContent: 'center',
    },
    currencyBadgeText: { fontSize: 13, fontWeight: '800', color: PURPLE },
    currencyCode: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
    currencyName: { fontSize: 11, color: GRAY, marginTop: 2 },
    currencyRight: { alignItems: 'flex-end' },
    currencyRate: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    currencyChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    currencyChange: { fontSize: 12, fontWeight: '600' },

    /* Empty */
    emptyCard: {
        marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', gap: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    emptyText: { fontSize: 14, color: GRAY, fontWeight: '500' },
    emptyBtn: {
        backgroundColor: PURPLE + '12', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4,
    },
    emptyBtnText: { fontSize: 13, fontWeight: '600', color: PURPLE },
});
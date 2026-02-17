import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';


import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { financeService } from '../../services/finance.service';
import type { CurrencyHoldingResponse, InvestmentResponse } from '../../src/models/finance.model';
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../../src/models/finance.model';
import { formatCurrency, getPnlColor, getPnlPrefix } from '../../src/utils/finance.utils';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function InvestmentsScreen() {
    const router = useRouter();
    const [investments, setInvestments] = useState<InvestmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [favoriteInvestmentIds, setFavoriteInvestmentIds] = useState<string[]>([]);

    // Load favorites from backend
    const loadFavorites = useCallback(async () => {
        try {
            const favs = await financeService.getFavoriteInvestments();
            setFavoriteInvestmentIds(favs.map(f => f.id));
        } catch (error) {
            console.error('[InvestmentsScreen] Failed to load favorites', error);
        }
    }, []);

    const toggleFavoriteInvestment = useCallback(async (investmentId: string) => {
        try {
            // Optimistic update
            setFavoriteInvestmentIds((prev) => {
                return prev.includes(investmentId)
                    ? prev.filter((id) => id !== investmentId)
                    : [...prev, investmentId];
            });
            await financeService.toggleFavoriteInvestment(investmentId);
        } catch (error) {
            console.error('[InvestmentsScreen] Failed to toggle favorite', error);
            loadFavorites();
        }
    }, [loadFavorites]);

    // ... (loadFavorites and toggleFavoriteInvestment remain unchanged)

    // Only show GOLD, SILVER, OTHER, and CURRENCY in the main list
    const filteredInvestments = useMemo(
        () => {
            console.log('[InvestmentsScreen] Total investments before filter:', investments.length);
            const filtered = investments.filter((investment) => {
                const match = ['GOLD', 'SILVER', 'OTHER', 'CURRENCY'].includes(investment.assetType);
                if (!match) console.log('[InvestmentsScreen] Filtered out:', investment.assetType, investment.symbol);
                return match;
            });
            console.log('[InvestmentsScreen] Filtered investments count:', filtered.length);
            return filtered;
        },
        [investments],
    );

    const logGetInvestmentsError = useCallback((error: unknown, context: Record<string, unknown>) => {
        if (axios.isAxiosError(error)) {
            // Downgrade 400/429 errors to warn to avoid Red Box in Expo
            if (error.response?.status === 400 || error.response?.status === 429) {
                console.warn('[InvestmentsScreen] Fetch ignored (Rate Limit/Bad Request)', error.message);
            } else {
                console.error('[InvestmentsScreen] GET /v1/finance/investments failed', {
                    context,
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                });
            }
            return;
        }
        console.error('[InvestmentsScreen] Unknown error while loading investments', { context, error });
    }, []);

    const loadInvestments = useCallback(async (pageNum: number, shouldRefresh = false) => {
        try {
            if (pageNum === 0) setLoading(true);

            console.log('[InvestmentsScreen] Requesting investments', { page: pageNum });

            // Parallel fetch for first page
            const requests: Promise<any>[] = [
                financeService.getInvestments(pageNum, 20, 'updatedAt', 'DESC')
            ];

            // Only fetch currency holdings on first page load/refresh
            if (pageNum === 0) {
                requests.push(financeService.getCurrencyHoldings().catch(err => {
                    console.error('Failed to load currency holdings', err);
                    return [];
                }));
            }

            const results = await Promise.all(requests);

            const investmentResponse = results[0];
            const investmentContent = Array.isArray(investmentResponse.content) ? investmentResponse.content : [];

            let finalInvestments = [...investmentContent];

            // Merge currency holdings if available
            if (pageNum === 0 && results[1]) {
                const holdings = Array.isArray(results[1]) ? results[1] : [];
                const currencyInvestments: InvestmentResponse[] = holdings.map((h: CurrencyHoldingResponse) => ({
                    id: `currency_${h.id}`, // Unique ID for list key
                    assetType: 'CURRENCY',
                    symbol: h.currencyCode,
                    quantity: h.amount,
                    currency: 'TRY', // Typically holdings are valued in TRY base
                    currentPrice: h.currentRate,
                    currentValue: (h.amount || 0) * (h.currentRate || 1),
                    avgCostMinor: h.buyRate ? Math.round(h.buyRate * 100) : 0, // Converting rate to minor units if needed, or just use as is in display logic
                    profitLoss: h.profitLoss,
                    profitLossPercent: h.profitLossPercent,
                    updatedAt: h.updatedAt || new Date().toISOString(),
                    name: h.currencyCode + ' Hesabı',
                } as InvestmentResponse)); // Cast to satisfy type

                // Add currency items to the BEGINNING of the list or end? 
                // Let's add them to the beginning for visibility or mix them.
                // For now, adding to the beginning given they are "Cash" equivalents.
                finalInvestments = [...currencyInvestments, ...finalInvestments];
            }

            // Normalize asset types to uppercase to match frontend constants
            finalInvestments = finalInvestments.map(inv => ({
                ...inv,
                assetType: inv.assetType ? inv.assetType.toUpperCase() : 'OTHER'
            }));

            if (shouldRefresh) {
                setInvestments(finalInvestments);
            } else {
                setInvestments(prev => pageNum === 0 ? finalInvestments : [...prev, ...finalInvestments]);
            }

            setHasMore(!investmentResponse.last);
            setPage(pageNum);
        } catch (error) {
            logGetInvestmentsError(error, { pageNum, shouldRefresh });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [logGetInvestmentsError]);

    useFocusEffect(
        useCallback(() => {
            console.log('[InvestmentsScreen] focused');
            loadInvestments(0, true);
            loadFavorites();
            return () => {
                console.log('[InvestmentsScreen] focus cleanup');
            };
        }, [loadInvestments, loadFavorites])
    );



    const onRefresh = () => {
        setRefreshing(true);
        loadInvestments(0, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            loadInvestments(page + 1);
        }
    };

    const handleDelete = useCallback((item: InvestmentResponse) => {
        Alert.alert(
            'Yatırımı Sil',
            `${item.symbol} yatırımını silmek istediğinize emin misiniz?`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await financeService.deleteInvestment(item.id);
                            // Refresh list
                            loadInvestments(0, true);
                        } catch (err: any) {
                            Alert.alert('Hata', 'Yatırım silinemedi: ' + (err.message || 'Bilinmeyen hata'));
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    }, [loadInvestments]);

    const renderItem = ({ item }: { item: InvestmentResponse }) => {
        const isCurrency = item.assetType === 'CURRENCY';
        // For CURRENCY, avgCostMinor was mapped from buyRate * 100.
        // Standard logic: cost = avgCost * quantity. 
        // If avgCostMinor is rate * 100, then cost = (rate * 100 / 100) * quantity = rate * quantity.
        // This matches standard logic. 
        const cost = (item.avgCostMinor || 0) / 100 * item.quantity;
        const currentVal = item.currentValue || 0;
        const pnl = currentVal - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        const isFavorite = favoriteInvestmentIds.includes(item.id);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
            // Navigate to detail if implemented, for now just placeholder or edit
            // onPress={() => router.push(`/(finance)/investment-detail?id=${item.id}`)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconBg, { backgroundColor: (ASSET_TYPE_COLORS[item.assetType] || GRAY) + '20' }]}>
                            <Ionicons
                                name={(ASSET_TYPE_ICONS[item.assetType] || 'ellipsis-horizontal') as IoniconsName}
                                size={20}
                                color={ASSET_TYPE_COLORS[item.assetType] || GRAY}
                            />
                        </View>
                        <View>
                            <Text style={styles.symbol}>{item.symbol}</Text>
                            <Text style={styles.type}>{ASSET_TYPE_LABELS[item.assetType] || item.assetType}</Text>
                        </View>
                    </View>
                    <View style={styles.rightContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            {!isCurrency && (
                                <TouchableOpacity
                                    onPress={() => handleDelete(item)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => toggleFavoriteInvestment(item.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={isFavorite ? 'star' : 'star-outline'}
                                    size={18}
                                    color={isFavorite ? '#F7B500' : '#C9CED6'}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.value}>{formatCurrency(currentVal, item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : '₺')}</Text>
                        <Text style={styles.quantity}>{item.quantity} adet</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Maliyet</Text>
                        <Text style={styles.statValue}>{formatCurrency(cost)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Kâr/Zarar</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name={pnl >= 0 ? 'caret-up' : 'caret-down'} size={12} color={getPnlColor(pnl)} />
                            <Text style={[styles.statValue, { color: getPnlColor(pnl) }]}>
                                {getPnlPrefix(pnl)}{formatCurrency(pnl)} ({getPnlPrefix(pnlPct)}{pnlPct.toFixed(1)}%)
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yatırımlarım</Text>
                <TouchableOpacity
                    onPress={() => router.push('/(finance)/add-transaction')}
                    style={styles.addBtn}
                >
                    <Ionicons name="add" size={24} color={PURPLE} />
                </TouchableOpacity>
            </View>

            {loading && page === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <FlatList
                    data={filteredInvestments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View>
                            {/* Investments Title */}
                            <View style={styles.allInvestmentsTitleRow}>
                                <Ionicons name="layers" size={14} color={GRAY} />
                                <Text style={styles.allInvestmentsTitle}>Varlıklar</Text>
                            </View>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color="#E0E0E0" />
                            <Text style={styles.emptyText}>Bu kategoride varlık bulunmuyor</Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => router.push('/(finance)/add-transaction')}
                            >
                                <Text style={styles.emptyBtnText}>Yatırım Ekle</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListFooterComponent={
                        loading && page > 0 ? <ActivityIndicator size="small" color={PURPLE} style={{ margin: 20 }} /> : null
                    }
                />
            )}
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    /* Header */
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
    addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

    /* List */
    listContent: { padding: 20, paddingBottom: 40 },

    /* Card */
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    iconContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    symbol: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
    type: { fontSize: 12, color: GRAY, fontWeight: '500' },
    rightContainer: { alignItems: 'flex-end' },
    value: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
    quantity: { fontSize: 12, color: GRAY, fontWeight: '500' },
    favoriteBtn: { marginBottom: 8 },

    divider: { height: 1, backgroundColor: '#F5F5F5', marginBottom: 12 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { gap: 4 },
    statLabel: { fontSize: 11, color: GRAY, fontWeight: '600', textTransform: 'uppercase' },
    statValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

    /* Empty */
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
    emptyText: { fontSize: 15, color: GRAY, fontWeight: '500' },
    emptyBtn: {
        marginTop: 12, backgroundColor: PURPLE + '15', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12
    },
    emptyBtnText: { color: PURPLE, fontWeight: '600' },

    allInvestmentsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    allInvestmentsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: GRAY,
        textTransform: 'uppercase',
    },
    sectionContainer: { marginBottom: 16 },
});

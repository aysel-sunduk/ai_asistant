import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';


import {
    ActivityIndicator,
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
import type { InvestmentResponse } from '../../src/models/finance.model';
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

    const loadInvestments = useCallback(async (pageNum: number, shouldRefresh = false) => {
        try {
            if (pageNum === 0) setLoading(true);
            // Default sort: updatedAt DESC
            const response = await financeService.getInvestments(pageNum, 20, 'updatedAt', 'DESC');

            if (shouldRefresh) {
                setInvestments(response.content);
            } else {
                setInvestments(prev => [...prev, ...response.content]);
            }

            setHasMore(!response.last);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to load investments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadInvestments(0, true);
        }, [loadInvestments])
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

    const renderItem = ({ item }: { item: InvestmentResponse }) => {
        const cost = (item.avgCostMinor || 0) / 100 * item.quantity;
        const currentVal = item.currentValue || 0;
        const pnl = currentVal - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

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
                    data={investments}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color="#E0E0E0" />
                            <Text style={styles.emptyText}>Henüz yatırımınız bulunmuyor</Text>
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
        </View>
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
    emptyBtnText: { color: PURPLE, fontWeight: '600' }
});

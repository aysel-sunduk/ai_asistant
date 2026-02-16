import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { financeService } from '../../services/finance.service';
import type { CurrencyRateResponse, FavoriteCurrencyResponse } from '../../src/models/finance.model';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

const getPnlColor = (val: number) => (val >= 0 ? '#34D399' : '#FF6B6B');
const getPnlPrefix = (val: number) => (val >= 0 ? '+' : '');

export default function ExchangeRatesScreen() {
    const router = useRouter();

    const [currencies, setCurrencies] = useState<CurrencyRateResponse[]>([]);
    const [favorites, setFavorites] = useState<FavoriteCurrencyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadData = useCallback(async (p = 0, append = false) => {
        setError(null);
        try {
            const [curRes, favRes] = await Promise.all([
                financeService.getCurrencies(p, 50),
                p === 0 ? financeService.getFavorites() : Promise.resolve(null),
            ]);

            if (append) {
                setCurrencies((prev) => [...prev, ...curRes.content]);
            } else {
                setCurrencies(curRes.content);
            }
            if (favRes) {
                setFavorites(favRes);
            }

            setHasMore(!curRes.last);
            setPage(p);
        } catch (err: any) {
            console.warn('Exchange rates error:', err?.message || err);
            setError(err?.response?.data?.message || err?.message || 'Kurlar yüklenemedi');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData(0);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData(0);
    };

    const loadMore = () => {
        if (hasMore && !loading) loadData(page + 1, true);
    };

    const toggleFavorite = async (currencyCode: string) => {
        const isFav = favorites.some((f) => f.currencyCode === currencyCode);

        // Optimistic update
        let newFavs = [...favorites];
        if (isFav) {
            newFavs = newFavs.filter((f) => f.currencyCode !== currencyCode);
        } else {
            // Placeholder for optimistic add
            const rate = currencies.find(c => c.currencyCode === currencyCode);
            if (rate) {
                newFavs.push({
                    id: 'temp',
                    currencyCode: rate.currencyCode,
                    currencyName: rate.currencyName,
                    rate: rate.rate,
                    changeRate: rate.changeRate,
                    baseCurrency: rate.baseCurrency,
                    rateDate: rate.rateDate
                });
            }
        }
        setFavorites(newFavs);

        try {
            if (isFav) {
                await financeService.removeFavorite(currencyCode);
            } else {
                await financeService.addFavorite({ currencyCode });
            }
            // Refresh favorites to get real IDs/data
            const updatedFavs = await financeService.getFavorites();
            setFavorites(updatedFavs);
        } catch (err) {
            console.error('Toggle favorite error:', err);
            // Revert on error
            loadData(0);
        }
    };

    // Filter by search
    const filtered = search.trim()
        ? currencies.filter(
            (c) =>
                c.currencyCode?.toLowerCase().includes(search.toLowerCase()) ||
                c.currencyName?.toLowerCase().includes(search.toLowerCase()),
        )
        : currencies;

    // Fav codes set for easy lookup
    const favCodes = new Set(favorites.map(f => f.currencyCode));

    // Sort: favorites first, then rest
    const sorted = [...filtered].sort((a, b) => {
        const aFav = favCodes.has(a.currencyCode) ? 0 : 1;
        const bFav = favCodes.has(b.currencyCode) ? 0 : 1;
        return aFav - bFav;
    });

    const favCount = sorted.filter((c) => favCodes.has(c.currencyCode)).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.loadingText}>Kurlar yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Döviz Kurları</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.searchRow}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kur ara... (USD, EUR)"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.headerSub}>
                    {currencies.length} kur · {favorites.length} favori
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
                onMomentumScrollEnd={loadMore}
            >
                {error ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="alert-circle-outline" size={36} color="#FF6B6B" />
                        <Text style={styles.emptyText}>{error}</Text>
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={() => { setLoading(true); loadData(0); }}>
                            <Text style={styles.loadMoreText}>Tekrar Dene</Text>
                        </TouchableOpacity>
                    </View>
                ) : sorted.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="search-outline" size={32} color="#E0E0E0" />
                        <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
                    </View>
                ) : (
                    <View style={styles.card}>
                        {sorted.map((cur, i) => {
                            const isCurFav = favCodes.has(cur.currencyCode);
                            const showFavDivider = i === favCount && favCount > 0;
                            const change = Number(cur.changeRate);

                            return (
                                <React.Fragment key={cur.currencyCode + '_' + (cur.id || i)}>
                                    {/* Favori header */}
                                    {i === 0 && favCount > 0 && (
                                        <View style={styles.inlineHeader}>
                                            <Ionicons name="star" size={14} color="#FFD93D" />
                                            <Text style={styles.inlineHeaderText}>Favoriler ({favCount})</Text>
                                        </View>
                                    )}
                                    {i === 0 && favCount === 0 && (
                                        <View style={styles.inlineHeader}>
                                            <Ionicons name="cash-outline" size={14} color={PURPLE} />
                                            <Text style={styles.inlineHeaderText}>Tüm Kurlar</Text>
                                        </View>
                                    )}
                                    {/* Divider between favs and rest */}
                                    {showFavDivider && (
                                        <View style={styles.divider}>
                                            <View style={styles.dividerLine} />
                                            <Text style={styles.dividerText}>Tüm Kurlar</Text>
                                            <View style={styles.dividerLine} />
                                        </View>
                                    )}
                                    <View style={[styles.currencyRow, i < sorted.length - 1 && styles.currencyRowBorder]}>
                                        <TouchableOpacity
                                            onPress={() => toggleFavorite(cur.currencyCode)}
                                            style={styles.favBtn}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons
                                                name={isCurFav ? 'star' : 'star-outline'}
                                                size={20}
                                                color={isCurFav ? '#FFD93D' : '#D4D4D4'}
                                            />
                                        </TouchableOpacity>
                                        <View style={[styles.currencyBadge, isCurFav && { backgroundColor: '#FEF3C7' }]}>
                                            <Text style={[styles.currencyBadgeText, isCurFav && { color: '#D97706' }]}>
                                                {cur.currencyCode?.slice(0, 2) || '??'}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.currencyCode}>
                                                {cur.currencyCode}/{cur.baseCurrency || 'TRY'}
                                            </Text>
                                            <Text style={styles.currencyName}>{cur.currencyName}</Text>
                                        </View>
                                        <View style={styles.currencyRight}>
                                            <Text style={styles.currencyRate}>{Number(cur.rate).toFixed(4)}</Text>
                                            {cur.changeRate != null && (
                                                <View style={styles.currencyChangeRow}>
                                                    <Ionicons
                                                        name={change >= 0 ? 'caret-up' : 'caret-down'}
                                                        size={10}
                                                        color={getPnlColor(change)}
                                                    />
                                                    <Text style={[styles.currencyChange, { color: getPnlColor(change) }]}>
                                                        {getPnlPrefix(change)}{change.toFixed(2)}%
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </React.Fragment>
                            );
                        })}
                    </View>
                )}

                {hasMore && (
                    <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                        <Text style={styles.loadMoreText}>Daha fazla yükle</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 12, color: GRAY, fontSize: 14 },

    header: {
        backgroundColor: PURPLE, borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        paddingBottom: 20, shadowColor: PURPLE, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8 },
    searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginHorizontal: 20, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: '500', color: '#fff' },

    scroll: { padding: 20, paddingBottom: 40 },

    card: {
        backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },

    inlineHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
        backgroundColor: '#FAFAFA',
    },
    inlineHeaderText: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.3 },

    divider: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FAFAFA',
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E8E8' },
    dividerText: { fontSize: 11, fontWeight: '700', color: GRAY, textTransform: 'uppercase', letterSpacing: 0.3 },

    currencyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    currencyRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    favBtn: { padding: 4 },
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

    emptyCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', gap: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    emptyText: { fontSize: 14, color: GRAY },

    loadMoreBtn: {
        alignItems: 'center', paddingVertical: 14, marginTop: 12,
        backgroundColor: PURPLE + '12', borderRadius: 14,
    },
    loadMoreText: { fontSize: 14, fontWeight: '600', color: PURPLE },
});

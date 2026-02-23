// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { CurrencyRateResponse, FavoriteCurrencyResponse, SupportedCurrencyResponse } from '../../src/models/finance.model';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

const getPnlColor = (val: number) => (val >= 0 ? '#34D399' : '#FF6B6B');
const getPnlPrefix = (val: number) => (val >= 0 ? '+' : '');

const formatServerTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
        // Extract time part directly from ISO string (HH:mm:ss) to match server time text
        // Format: 2026-02-19T07:53:03.840Z -> 07:53:03
        if (isoString.includes('T')) {
            const timePart = isoString.split('T')[1];
            if (timePart) {
                return timePart.split('.')[0];
            }
        }
        // Fallback to local time if parsing fails
        return new Date(isoString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return '';
    }
};

export default function ExchangeRatesScreen() {
    const router = useRouter();

    const [favorites, setFavorites] = useState<FavoriteCurrencyResponse[]>([]);
    const [supportedInfo, setSupportedInfo] = useState<SupportedCurrencyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Cache for latest rates of searched items to avoid refetching
    const [searchedRates, setSearchedRates] = useState<Record<string, CurrencyRateResponse>>({});

    // UseRef to track in-flight requests without triggering re-renders
    const fetchingCodes = React.useRef<Set<string>>(new Set());

    const loadData = useCallback(async () => {
        setError(null);
        try {
            const [favRes, supRes] = await Promise.all([
                financeService.getFavorites(),
                financeService.getSupportedCurrencies(),
            ]);

            let initialFavs = Array.isArray(favRes) ? favRes : [];
            const supported = Array.isArray(supRes) ? supRes : [];

            // Enrich favorites with latest live data to ensure accurate lastUpdatedAt
            if (initialFavs.length > 0) {
                try {
                    // Use bulk fetch to avoid rate limits and getting "current time" from backend on failures
                    // Assuming 'TRY' base is what we want for these
                    const allRates = await financeService.getLatestRates('TRY');

                    // Create a lookup map
                    const ratesMap = new Map(allRates.map(r => [r.currencyCode, r]));

                    initialFavs = initialFavs.map((fav, index) => {
                        const live = ratesMap.get(fav.currencyCode);
                        if (live) {
                            return {
                                ...fav,
                                rate: live.rate,
                                changeRate: live.changeRate,
                                lastUpdatedAt: live.lastUpdatedAt,
                                providerTimestamp: live.providerTimestamp,
                                currencyName: live.currencyName || fav.currencyName,
                            };
                        }
                        return fav;
                    });
                } catch (innerErr) {
                    console.warn('Failed to enrich favorites with live rates:', innerErr);
                }
            }

            setFavorites(initialFavs);
            setSupportedInfo(supported);
        } catch (err: any) {
            console.warn('Exchange rates error:', err?.message || err);
            setError(err?.response?.data?.message || err?.message || 'Veriler yüklenemedi');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const fetchRateForCode = async (code: string) => {
        // If we already have it or it's actively fetching, skip
        if (searchedRates[code] || fetchingCodes.current.has(code)) return;

        fetchingCodes.current.add(code);
        try {
            const rate = await financeService.getLatestRate(code);
            setSearchedRates(prev => ({ ...prev, [code]: rate }));
        } catch (e) {
            console.warn(`Failed to fetch rate for ${code}`, e);
        } finally {
            fetchingCodes.current.delete(code);
        }
    };

    const toggleFavorite = async (currencyCode: string) => {
        const isFav = favorites.some((f) => f.currencyCode === currencyCode);

        // Optimistic update
        let newFavs = [...favorites];
        if (isFav) {
            newFavs = newFavs.filter((f) => f.currencyCode !== currencyCode);
        } else {
            // If we have the rate details from search, use them for optimistic add
            const rate = searchedRates[currencyCode];
            newFavs.push({
                id: 'temp_' + Date.now(),
                currencyCode: currencyCode,
                currencyName: rate?.currencyName || currencyCode,
                rate: rate?.rate || 0,
                changeRate: rate?.changeRate || 0,
                baseCurrency: 'TRY',
                rateDate: rate?.lastUpdatedAt || new Date().toISOString(),
                lastUpdatedAt: rate?.lastUpdatedAt,
                providerTimestamp: rate?.providerTimestamp
            });
        }
        setFavorites(newFavs);

        try {
            if (isFav) {
                await financeService.removeFavorite(currencyCode);
            } else {
                await financeService.addFavorite({ currencyCode });
            }
            // Reload all data to ensure consistency and fresh rates
            loadData();
        } catch (err) {
            console.error('Toggle favorite error:', err);
            // Revert on error
            loadData();
        }
    };

    // Filter supported currencies by search
    // If search is empty, show nothing (or just favorites)
    // If search is active, show matching supported currencies
    const isSearching = search.trim().length > 0;

    const filteredSupported = useMemo(() => isSearching
        ? supportedInfo.filter(code => code.toLowerCase().includes(search.toLowerCase()))
        : [], [isSearching, supportedInfo, search]);

    // Trigger fetch for visible search results if missing
    useEffect(() => {
        if (isSearching) {
            const topResults = filteredSupported.slice(0, 10);
            topResults.forEach(code => {
                // Determine if we need to fetch rate
                // We verify if it is NOT in favorites (favorites already have rates)
                // and NOT in searchedRates
                const isFav = favorites.some(f => f.currencyCode === code);
                if (!isFav && !searchedRates[code]) {
                    fetchRateForCode(code);
                }
            });
        }
    }, [search, filteredSupported, favorites, searchedRates]);

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
                    <Text style={styles.headerTitle}>Kur Takip Listesi</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.searchRow}>
                    <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kur ekle... (USD, EUR, GOLD)"
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
                    {favorites.length} öge takip ediliyor
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
            >
                {error && (
                    <View style={styles.errorCard}>
                        <Text style={{ color: '#fff' }}>Hata: {error}</Text>
                    </View>
                )}

                {/* Search Results Section */}
                {isSearching && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Arama Sonuçları</Text>
                        {filteredSupported.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
                            </View>
                        ) : (
                            filteredSupported.map((code) => {
                                const isFav = favorites.some(f => f.currencyCode === code);
                                const rateInfo = searchedRates[code]; // May be undefined if loading
                                // If it is fav, we might want to show the fav data instead? 
                                // Actually let's just use the fav data if available
                                const favData = favorites.find(f => f.currencyCode === code);

                                const displayRate = isFav ? favData?.rate : rateInfo?.rate;
                                const displayChange = isFav ? favData?.changeRate : rateInfo?.changeRate;
                                const displayName = isFav ? favData?.currencyName : rateInfo?.currencyName;

                                return (
                                    <View key={code} style={styles.currencyRow}>
                                        <TouchableOpacity
                                            onPress={() => toggleFavorite(code)}
                                            style={styles.favBtn}
                                        >
                                            <Ionicons
                                                name={isFav ? 'star' : 'star-outline'}
                                                size={22}
                                                color={isFav ? '#FFD93D' : '#D4D4D4'}
                                            />
                                        </TouchableOpacity>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.currencyCode}>{displayName || code}</Text>
                                            <Text style={styles.currencyName}>{code}</Text>
                                        </View>
                                        <View style={styles.currencyRight}>
                                            {displayRate ? (
                                                <>
                                                    <Text style={styles.currencyRate}>{Number(displayRate).toFixed(4)}</Text>
                                                    {displayChange != null && (
                                                        <Text style={[styles.currencyChange, { color: getPnlColor(displayChange) }]}>
                                                            {getPnlPrefix(displayChange)}{Number(displayChange).toFixed(2)}%
                                                        </Text>
                                                    )}
                                                    {(favData?.providerTimestamp || favData?.lastUpdatedAt || rateInfo?.providerTimestamp || rateInfo?.lastUpdatedAt) && (
                                                        <Text style={styles.lastUpdatedText}>
                                                            {formatServerTime(favData?.providerTimestamp || favData?.lastUpdatedAt || rateInfo?.providerTimestamp || rateInfo?.lastUpdatedAt)}
                                                        </Text>
                                                    )}
                                                </>
                                            ) : (
                                                <ActivityIndicator size="small" color={GRAY} />
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                        <View style={styles.divider} />
                    </View>
                )}

                {/* Favorites List */}
                {!isSearching && (
                    <View style={styles.card}>
                        {favorites.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="star-outline" size={48} color="#E0E0E0" />
                                <Text style={styles.emptyText}>Listeniz boş</Text>
                                <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>Yukarıdan arama yaparak ekleyebilirsiniz.</Text>
                            </View>
                        ) : (
                            favorites.map((fav, i) => {
                                const change = Number(fav.changeRate);
                                return (
                                    <React.Fragment key={fav.id || fav.currencyCode}>
                                        <View style={[styles.currencyRow, i < favorites.length - 1 && styles.currencyRowBorder]}>
                                            <TouchableOpacity
                                                onPress={() => toggleFavorite(fav.currencyCode)}
                                                style={styles.favBtn}
                                            >
                                                <Ionicons name="star" size={22} color="#FFD93D" />
                                            </TouchableOpacity>
                                            <View style={[styles.currencyBadge, { backgroundColor: '#FEF3C7' }]}>
                                                <Text style={[styles.currencyBadgeText, { color: '#D97706' }]}>
                                                    {fav.currencyCode?.slice(0, 2)}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.currencyCode}>{fav.currencyName || fav.currencyCode}</Text>
                                                <Text style={styles.currencyName}>{fav.currencyCode}</Text>
                                            </View>
                                            <View style={styles.currencyRight}>
                                                <Text style={styles.currencyRate}>{Number(fav.rate).toFixed(4)}</Text>
                                                {fav.changeRate != null && (
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
                                                {(fav.providerTimestamp || fav.lastUpdatedAt) && (
                                                    <Text style={styles.lastUpdatedText}>
                                                        {formatServerTime(fav.providerTimestamp || fav.lastUpdatedAt)}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </View>
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

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: GRAY, marginBottom: 10, textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },

    card: {
        backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    errorCard: {
        backgroundColor: '#EF4444', padding: 12, borderRadius: 12, marginBottom: 16
    },

    currencyRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 8 },
    currencyRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5', borderRadius: 0, marginBottom: 0 },
    favBtn: { padding: 4 },
    currencyBadge: {
        width: 38, height: 38, borderRadius: 12, backgroundColor: '#EDE9FE',
        alignItems: 'center', justifyContent: 'center', marginLeft: 8
    },
    currencyBadgeText: { fontSize: 13, fontWeight: '800', color: PURPLE },
    currencyCode: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
    currencyName: { fontSize: 12, color: GRAY, marginTop: 2 },
    currencyRight: { alignItems: 'flex-end', marginLeft: 'auto' },
    currencyRate: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
    currencyChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    currencyChange: { fontSize: 13, fontWeight: '600' },
    lastUpdatedText: { fontSize: 10, color: '#9BA1A6', marginTop: 2, textAlign: 'right' },

    emptyCard: {
        backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', gap: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    emptyText: { fontSize: 14, color: GRAY, textAlign: 'center' },
});
// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
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
import type { CurrencyHoldingResponse, FinanceDashboardResponse, InvestmentResponse } from '../../src/models/finance.model';
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../../src/models/finance.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useFinanceStore } from '../../src/store/finance.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

import { formatCurrency, getInvestmentDisplayName, getPnlColor, getPnlPrefix } from '../../src/utils/finance.utils';

export default function FinanceScreen() {
    const router = useRouter();
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    // Global Store State
    const { 
        dashboard, 
        performance, 
        favCurrencies, 
        favInvestments, 
        aiRecommendations, 
        isLoading, 
        error,
        fetchDashboardData 
    } = useFinanceStore();

    const [selectedRec, setSelectedRec] = useState<any | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Load data handles both initial and focus-based refreshes
    const loadData = useCallback(async () => {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
            return;
        }
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    if (isLoading && !dashboard && !performance) {
        return (
            <View style={[styles.loadingContainer, isDark && { backgroundColor: '#0B1220' }]}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.screenRoot, isDark && styles.screenRootDark]}>
            <FinanceScreenContent
                dashboard={dashboard}
                favCurrencies={favCurrencies}
                favInvestments={favInvestments}
                aiRecommendations={aiRecommendations}
                performance={performance}
                refreshing={refreshing}
                onRefresh={onRefresh}
                router={router}
                errorMsg={error}
                onShowRecDetail={(rec: any) => {
                    setSelectedRec(rec);
                    setModalVisible(true);
                }}
            />
            <RecommendationDetailModal
                visible={modalVisible}
                recommendation={selectedRec}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
}

function RecommendationDetailModal({ visible, recommendation, onClose }: { visible: boolean, recommendation: any, onClose: () => void }) {
    const modeM = useThemeStore((s) => s.mode);
    const schemeM = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(modeM, schemeM) === 'dark';
    if (!recommendation) return null;

    const actionColor = recommendation.recommendationType === 'BUY' ? '#10B981'
        : recommendation.recommendationType === 'SELL' ? '#EF4444' : '#F59E0B';
    const actionLabel = recommendation.recommendationType === 'BUY' ? 'AL'
        : recommendation.recommendationType === 'SELL' ? 'SAT' : 'POZİSYONU KORU';
    const riskLabel = recommendation.riskLevel === 'HIGH' ? 'Yüksek Risk'
        : recommendation.riskLevel === 'MEDIUM' ? 'Orta Risk' : 'Düşük Risk';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                    <View style={styles.modalHeader}>
                        <View style={[styles.recActionBadge, { backgroundColor: actionColor + '18' }]}>
                            <Text style={[styles.recActionText, { color: actionColor, fontSize: 13 }]}>{actionLabel}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={GRAY} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalSymbol, isDark && styles.textDark]}>
                        {getInvestmentDisplayName(recommendation.symbol, recommendation.assetType) || recommendation.symbol}
                    </Text>
                    <Text style={styles.modalAssetType}>{recommendation.assetType}</Text>

                    <View style={styles.modalStatsRow}>
                        <View style={styles.modalStatItem}>
                            <Text style={[styles.modalStatLabel, isDark && styles.subDark]}>GÜVEN SKORU</Text>
                            <Text style={[styles.modalStatValue, { color: actionColor }]}>%{Number(recommendation.confidenceScore || 0).toFixed(1)}</Text>
                        </View>
                        <View style={styles.modalStatItem}>
                            <Text style={[styles.modalStatLabel, isDark && styles.subDark]}>RİSK SEVİYESİ</Text>
                            <Text style={[styles.modalStatValue, { color: actionColor }]}>{riskLabel}</Text>
                        </View>
                    </View>

                    <View style={styles.modalDivider} />

                    <View style={[styles.modalInfoBox, isDark && styles.modalInfoBoxDark]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color={PURPLE} style={{ marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.modalInfoTitle, isDark && styles.textDark]}>AI Analizi</Text>
                            <Text style={[styles.modalInfoDetail, isDark && styles.subDark]}>{recommendation.reason}</Text>
                        </View>
                    </View>

                    <View style={styles.modalDisclaimerBox}>
                        <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                        <Text style={[styles.modalDisclaimerText, isDark && styles.subDark]}>
                            Bu bir yatırım tavsiyesi değildir. Lütfen kendi araştırmanızı yapınız.
                        </Text>
                    </View>

                    <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: PURPLE }]} onPress={onClose}>
                        <Text style={styles.modalActionBtnText}>Anladım</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

function FinanceScreenContent({
    dashboard,
    favCurrencies,
    favInvestments,
    aiRecommendations,
    performance,
    refreshing,
    onRefresh,
    router,
    errorMsg,
    onShowRecDetail
}: any) {
    const mode2 = useThemeStore((s) => s.mode);
    const systemScheme2 = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode2, systemScheme2) === 'dark';

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
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0B1220' : '#F8F9FA'} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── Header ─── */}
                <View style={[styles.header, isDark && styles.headerDark]}>
                    <View>
                        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Finans</Text>
                        <TouchableOpacity onPress={() => router.push('/(finance)/history')}>
                            <Text style={[styles.headerSubtitle, { color: PURPLE, fontWeight: '600' }]}>
                                Geçmişi Gör <Ionicons name="chevron-forward" size={12} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={[styles.iconBtn, isDark && styles.iconBtnDark]} onPress={onRefresh}>
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
                    <View style={[styles.statCard, isDark && styles.cardDark]}>
                        <View style={[styles.statIcon, { backgroundColor: isDark ? '#2D1B69' : '#EDE9FE' }]}>
                            <Ionicons name="arrow-down-circle" size={18} color={PURPLE} />
                        </View>
                        <Text style={[styles.statLabel, isDark && styles.subDark]}>Maliyet</Text>
                        <Text style={[styles.statValue, isDark && styles.textDark]}>{formatCurrency(totalCost)}</Text>
                    </View>
                    <View style={[styles.statCard, isDark && styles.cardDark]}>
                        <View style={[styles.statIcon, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
                            <Ionicons name="bar-chart" size={18} color="#34D399" />
                        </View>
                        <Text style={[styles.statLabel, isDark && styles.subDark]}>Değer</Text>
                        <Text style={[styles.statValue, isDark && styles.textDark]}>{formatCurrency(totalValue)}</Text>
                    </View>
                    <View style={[styles.statCard, isDark && styles.cardDark]}>
                        <View style={[styles.statIcon, { backgroundColor: pnl >= 0 ? (isDark ? '#064E3B' : '#D1FAE5') : (isDark ? '#7F1D1D' : '#FEE2E2') }]}>
                            <Ionicons
                                name={pnl >= 0 ? 'arrow-up' : 'arrow-down'}
                                size={18}
                                color={getPnlColor(pnl)}
                            />
                        </View>
                        <Text style={[styles.statLabel, isDark && styles.subDark]}>Kâr/Zarar</Text>
                        <Text style={[styles.statValue, { color: getPnlColor(pnl) }]}>
                            {getPnlPrefix(pnl)}{formatCurrency(pnl)}
                        </Text>
                    </View>
                </View>

                {/* ─── Dağılım ─── */}
                {Object.keys(allocation).length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Portföy Dağılımı</Text>
                        <View style={[styles.allocationCard, isDark && styles.cardDark]}>
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
                                        <Text style={[styles.legendText, isDark && styles.subDark]}>
                                            {ASSET_TYPE_LABELS[type] || (type === "CURRENCY" ? "Döviz" : type)} %{Number(pct).toFixed(0)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* ─── AI Yatırım Önerileri ─── */}
                {aiRecommendations && aiRecommendations.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24 }}>
                                <Ionicons name="bulb" size={16} color="#8B5CF6" />
                                <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>AI Yatırım Önerileri</Text>
                            </View>
                            <View style={styles.aiBadge}>
                                <Text style={styles.aiBadgeText}>AI</Text>
                            </View>
                        </View>

                        {/* Disclaimer */}
                        <View style={[styles.disclaimerCard, isDark && styles.disclaimerCardDark]}>
                            <Ionicons name="information-circle" size={16} color="#8B5CF6" />
                            <Text style={[styles.disclaimerText, isDark && styles.disclaimerTextDark]}>
                                Bu öneriler yapay zeka tarafından üretilmiştir ve yatırım tavsiyesi niteliği taşımamaktadır. Yatırım kararlarınızı almadan önce kendi araştırmanızı yapınız.
                            </Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20 }}>
                            {aiRecommendations.map((rec: any, index: number) => {
                                const actionColor = rec.recommendationType === 'BUY' ? '#10B981'
                                    : rec.recommendationType === 'SELL' ? '#EF4444' : '#F59E0B';
                                const actionIcon = rec.recommendationType === 'BUY' ? 'trending-up'
                                    : rec.recommendationType === 'SELL' ? 'trending-down' : 'pause';
                                const actionLabel = rec.recommendationType === 'BUY' ? 'AL'
                                    : rec.recommendationType === 'SELL' ? 'SAT' : 'POZİSYONU KORU';
                                const riskColor = rec.riskLevel === 'HIGH' ? '#EF4444'
                                    : rec.riskLevel === 'MEDIUM' ? '#F59E0B' : '#10B981';
                                const riskLabel = rec.riskLevel === 'HIGH' ? 'Yüksek Risk'
                                    : rec.riskLevel === 'MEDIUM' ? 'Orta Risk' : 'Düşük Risk';

                                return (
                                    <TouchableOpacity
                                        key={rec.id || index}
                                        style={[styles.recCard, isDark && styles.recCardDark]}
                                        activeOpacity={0.7}
                                        onPress={() => onShowRecDetail(rec)}
                                    >
                                        <View style={styles.recCardHeader}>
                                            <View style={[styles.recActionBadge, { backgroundColor: actionColor + '18' }]}>
                                                <Ionicons name={actionIcon as any} size={14} color={actionColor} />
                                                <Text style={[styles.recActionText, { color: actionColor }]}>{actionLabel}</Text>
                                            </View>
                                            <View style={[styles.recRiskBadge, { backgroundColor: riskColor + '18' }]}>
                                                <Text style={[styles.recRiskText, { color: riskColor }]}>{riskLabel}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.recSymbol, isDark && styles.textDark]}>
                                            {getInvestmentDisplayName(rec.symbol, rec.assetType) || rec.symbol}
                                        </Text>
                                        <Text style={styles.recAssetType}>{rec.assetType}</Text>
                                        <View style={styles.recConfidence}>
                                            <View style={styles.recConfBar}>
                                                <View style={[styles.recConfFill, { width: `${Math.min(rec.confidenceScore || 0, 100)}%`, backgroundColor: actionColor }]} />
                                            </View>
                                            <Text style={[styles.recConfText, isDark && styles.textDark]}>%{Number(rec.confidenceScore || 0).toFixed(0)}</Text>
                                        </View>
                                        <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                                        <View style={styles.recTapHint}>
                                            <Ionicons name="chevron-forward" size={12} color="#C4B5FD" />
                                            <Text style={styles.recTapHintText}>Detay için dokun</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
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
                        <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
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
                                        style={[styles.investmentCard, isDark && styles.cardDark]}
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
                                        <Text style={[styles.investmentSymbol, isDark && styles.textDark]}>{getInvestmentDisplayName(inv.symbol, inv.assetType) || inv.symbol}</Text>

                                        <Text style={[styles.investmentValue, isDark && styles.textDark]}>
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
                        <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
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
                        <View style={[styles.currencyCard, isDark && styles.cardDark]}>
                            {currenciesToShow.map((cur: any, index: number) => (
                                <View
                                    key={cur.id || index}
                                    style={[
                                        styles.currencyRow,
                                        index < favCurrencies.length - 1 && (isDark ? styles.currencyRowBorderDark : styles.currencyRowBorder),
                                    ]}
                                >
                                    <View style={styles.currencyLeft}>
                                        <View style={[styles.currencyBadge, { backgroundColor: '#FEF3C7' }]}>
                                            <Text style={[styles.currencyBadgeText, { color: '#D97706' }]}>
                                                {cur.currencyCode?.slice(0, 2) || '??'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.currencyCode, isDark && styles.textDark]}>{cur.currencyName}</Text>
                                            <Text style={styles.currencyName}>
                                                {cur.currencyCode}/{cur.baseCurrency || 'TRY'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.currencyRight}>
                                        <Text style={[styles.currencyRate, isDark && styles.textDark]}>
                                            {Number(cur.rate).toFixed(4)}
                                        </Text>
                                        {(cur.changePercent != null || cur.changeRate != null) && (
                                            <View style={styles.currencyChangeRow}>
                                                <Ionicons
                                                    name={Number(cur.changePercent ?? cur.changeRate) >= 0 ? 'caret-up' : 'caret-down'}
                                                    size={10}
                                                    color={getPnlColor(Number(cur.changePercent ?? cur.changeRate))}
                                                />
                                                <Text
                                                    style={[
                                                        styles.currencyChange,
                                                        { color: getPnlColor(Number(cur.changePercent ?? cur.changeRate)) },
                                                    ]}
                                                >
                                                    {getPnlPrefix(Number(cur.changePercent ?? cur.changeRate))}
                                                    {Number(cur.changePercent ?? (cur.changeRate * 100)).toFixed(2)}%
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
    screenRoot: { flex: 1, backgroundColor: '#F8F9FA' },
    screenRootDark: { backgroundColor: '#0B1220' },
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

    /* AI Recommendations */
    aiBadge: {
        backgroundColor: '#8B5CF6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginRight: 24,
    },
    aiBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    recCard: {
        width: 200, backgroundColor: '#fff', borderRadius: 18, padding: 16, marginRight: 12,
        shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
        borderWidth: 1, borderColor: '#F3F0FF',
    },
    recCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    recActionBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    recActionText: { fontSize: 11, fontWeight: '800' },
    recRiskBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
    recRiskText: { fontSize: 9, fontWeight: '700' },
    recSymbol: { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 2 },
    recAssetType: { fontSize: 11, color: GRAY, fontWeight: '500', marginBottom: 10 },
    recConfidence: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    recConfBar: { flex: 1, height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden' },
    recConfFill: { height: '100%', borderRadius: 2 },
    recConfText: { fontSize: 11, fontWeight: '700', color: '#1A1A2E' },
    recReason: { fontSize: 11, color: '#666', lineHeight: 16 },
    recTapHint: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8, justifyContent: 'flex-end' },
    recTapHintText: { fontSize: 9, color: '#C4B5FD', fontWeight: '600' },
    disclaimerCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: '#F5F3FF', borderRadius: 12, borderWidth: 1, borderColor: '#EDE9FE',
    },
    disclaimerText: { flex: 1, fontSize: 10, color: '#7C3AED', lineHeight: 15, fontWeight: '500' },

    /* Modal Styles */
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modalContent: {
        width: '100%', backgroundColor: '#fff', borderRadius: 32, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' },
    modalSymbol: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
    modalAssetType: { fontSize: 13, color: GRAY, fontWeight: '600', marginBottom: 24 },
    modalStatsRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
    modalStatItem: { flex: 1 },
    modalStatLabel: { fontSize: 10, color: GRAY, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
    modalStatValue: { fontSize: 16, fontWeight: '800' },
    modalDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 24 },
    modalInfoBox: { flexDirection: 'row', gap: 12, backgroundColor: '#F8F9FA', padding: 16, borderRadius: 20, marginBottom: 20 },
    modalInfoTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
    modalInfoDetail: { fontSize: 13, color: '#475569', lineHeight: 20 },
    modalDisclaimerBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 24 },
    modalDisclaimerText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
    modalActionBtn: { height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    modalActionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    headerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937', shadowOpacity: 0 },
    emptyCardDark: { backgroundColor: '#111827', shadowOpacity: 0 },
    recCardDark: { backgroundColor: '#111827', borderColor: '#1F2937', shadowOpacity: 0 },
    modalContentDark: { backgroundColor: '#111827' },
    modalInfoBoxDark: { backgroundColor: '#1E293B' },
    iconBtnDark: { backgroundColor: '#1E293B' },
    textDark: { color: '#E5E7EB' },
    subDark: { color: '#9CA3AF' },
    disclaimerCardDark: { backgroundColor: '#1E1B4B', borderColor: '#312E81' },
    disclaimerTextDark: { color: '#A5B4FC' },
    currencyRowBorderDark: { borderBottomWidth: 1, borderBottomColor: '#1F2937' },
});

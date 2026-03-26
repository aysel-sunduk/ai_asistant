// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from '../../components/ui/Toast';
import { familyService } from '../../services/family.service';
import { shoppingService } from '../../services/shopping.service';
import type {
    FamilyFinanceBucket,
    FamilyFinanceReportResponse,
    FamilyTransactionResponse,
    FamilyTransactionType,
} from '../../src/models/family.model';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PURPLE = '#6C63FF';

type Period = 'WEEKLY' | 'MONTHLY';

const currency = (v: number) => `₺${Number(v || 0).toFixed(2)}`;

export default function TransactionsScreen() {
    const router = useRouter();
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';
    const params = useLocalSearchParams();
    const externalStartDate = params.startDate as string | undefined;
    const externalEndDate = params.endDate as string | undefined;

    const [period, setPeriod] = useState<Period>('MONTHLY');
    const [report, setReport] = useState<FamilyFinanceReportResponse | null>(null);
    const [transactions, setTransactions] = useState<FamilyTransactionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [type, setType] = useState<FamilyTransactionType>('EXPENSE');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');

    const [isIncomeChartExpanded, setIsIncomeChartExpanded] = useState(false);
    const [isExpenseChartExpanded, setIsExpenseChartExpanded] = useState(false);
    const [monthOffset, setMonthOffset] = useState(0);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (nextType: 'success' | 'error' | 'info', message: string) => {
        setToastType(nextType);
        setToastMessage(message);
        setToastVisible(true);
    };

    const load = useCallback(async (selectedPeriod: Period, mOffset = monthOffset) => {
        setLoading(true);
        try {
            const start = externalStartDate;
            const end = externalEndDate;

            if (selectedPeriod === 'MONTHLY' && mOffset !== 0 && !start) {
                const { startDate: mStart, endDate: mEnd } = getMonthDates(mOffset);
                const [summaryRes, txPage] = await Promise.all([
                    familyService.getTransactionsSummary(mStart, mEnd),
                    familyService.getTransactions(0, 100, mStart, mEnd),
                ]);
                setReport({
                    period: 'MONTHLY',
                    startDate: mStart,
                    endDate: mEnd,
                    totalIncome: summaryRes.totalIncome,
                    totalExpense: summaryRes.totalExpense,
                    balance: summaryRes.balance,
                    previousIncome: 0,
                    previousExpense: 0,
                    previousBalance: 0,
                    incomeChangePct: 0,
                    expenseChangePct: 0,
                    balanceChangePct: 0,
                    buckets: [],
                } as any);
                setTransactions(txPage.content || []);
            } else {
                const [reportRes, txPage] = await Promise.all([
                    familyService.getTransactionsReport(selectedPeriod),
                    familyService.getTransactions(0, 100, start, end),
                ]);
                setReport(reportRes);
                setTransactions(txPage.content || []);
            }
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Rapor verisi alinamadi.');
        } finally {
            setLoading(false);
        }
    }, [externalStartDate, externalEndDate, monthOffset]);

    useFocusEffect(
        useCallback(() => {
            void load(period);
        }, [load, period]),
    );

    const switchPeriod = (next: Period) => {
        setPeriod(next);
        setMonthOffset(0);
        void load(next, 0);
    };

    const TURKISH_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    const getMonthDates = (offset: number) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() + offset);
        const year = d.getFullYear();
        const month = d.getMonth();
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const label = `${TURKISH_MONTHS[month]} ${year}`;
        return { startDate, endDate, label };
    };

    const goMonth = (direction: -1 | 1) => {
        const next = monthOffset + direction;
        if (next > 0) return;
        setMonthOffset(next);
        void load(period, next);
    };

    const chartMax = useMemo(() => {
        if (!report?.buckets?.length) return 1;
        const vals = report.buckets.flatMap((b) => [Number(b.income || 0), Number(b.expense || 0)]);
        return Math.max(1, ...vals);
    }, [report?.buckets]);

    const inPeriodTransactions = useMemo(() => {
        if (!report) return [];
        if (externalStartDate && externalEndDate) {
            return transactions.sort((a, b) => +new Date(b.occurredOn) - +new Date(a.occurredOn));
        }
        return transactions
            .filter((tx) => tx.occurredOn >= report.startDate && tx.occurredOn <= report.endDate)
            .sort((a, b) => +new Date(b.occurredOn) - +new Date(a.occurredOn));
    }, [report, transactions, externalStartDate, externalEndDate]);

    const incomeCategories = useMemo(() => {
        const incomeTxs = inPeriodTransactions.filter(tx => tx.type === 'INCOME');
        const grouped = incomeTxs.reduce((acc, tx) => {
            const cat = tx.category || 'Diğer';
            acc[cat] = (acc[cat] || 0) + (tx.amountMinor / 100);
            return acc;
        }, {} as Record<string, number>);

        const colors = ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0'];
        return Object.entries(grouped).map(([name, amount], index) => ({
            name,
            amount: Number(amount.toFixed(2)),
            color: colors[index % colors.length],
            legendFontColor: '#475569',
            legendFontSize: 12,
        })).sort((a, b) => b.amount - a.amount);
    }, [inPeriodTransactions]);

    const expenseCategories = useMemo(() => {
        const expenseTxs = inPeriodTransactions.filter(tx => tx.type === 'EXPENSE');
        const grouped = expenseTxs.reduce((acc, tx) => {
            const cat = tx.category || 'Diğer';
            acc[cat] = (acc[cat] || 0) + (tx.amountMinor / 100);
            return acc;
        }, {} as Record<string, number>);

        const colors = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#991B1B', '#B91C1C', '#7F1D1D'];
        return Object.entries(grouped).map(([name, amount], index) => ({
            name,
            amount: Number(amount.toFixed(2)),
            color: colors[index % colors.length],
            legendFontColor: '#475569',
            legendFontSize: 12,
        })).sort((a, b) => b.amount - a.amount);
    }, [inPeriodTransactions]);

    const INCOME_CATEGORIES = ['Maaş', 'Yatırım', 'Kira', 'Ek / Düzensiz Gelir'];
    const EXPENSE_CATEGORIES = ['Barınma', 'Faturalar & Abonelikler', 'Gıda', 'Ulaşım', 'Sağlık', 'Kişisel', 'Borç & Finans', 'Eğitim & Gelişim'];

    const onCreateTransaction = async () => {
        const parsed = Number.parseFloat(amount.trim().replace(',', '.'));
        if (!(parsed > 0)) {
            showToast('error', 'Tutar 0 dan buyuk olmali.');
            return;
        }

        const today = new Date().toISOString().slice(0, 10);
        setSaving(true);
        try {
            await familyService.createTransaction({
                type,
                amountMinor: Math.round(parsed * 100),
                currency: 'TRY',
                category: category.trim() || undefined,
                occurredOn: today,
                note: note.trim() || undefined,
            });
            setAmount('');
            setCategory('');
            setNote('');
            showToast('success', 'Islem eklendi.');
            await load(period);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Islem eklenemedi.');
        } finally {
            setSaving(false);
        }
    };

    const onDeleteTransaction = (id: string) => {
        Alert.alert('Islem sil', 'Bu kaydi silmek istiyor musun?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await familyService.deleteTransaction(id);
                        showToast('success', 'Islem silindi.');
                        await load(period);
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Islem silinemedi.');
                    }
                },
            },
        ]);
    };

    const onPressTransaction = async (tx: FamilyTransactionResponse) => {
        const note = tx.note || '';
        if (!note.startsWith('shopping_item:')) {
            return;
        }

        const itemId = note.replace('shopping_item:', '').trim();
        if (!itemId) {
            return;
        }

        try {
            const item = await shoppingService.getItemById(itemId);
            const price = typeof item.estimatedPriceMinor === 'number'
                ? `₺${(item.estimatedPriceMinor / 100).toFixed(2)}`
                : '-';
            Alert.alert(
                'Alisveris Detayi',
                [
                    `Urun: ${item.name}`,
                    `Durum: ${item.isChecked ? 'Alindi' : 'Alinacak'}`,
                    `Miktar: ${item.quantity} ${item.unit || 'adet'}`,
                    `Fiyat: ${price}`,
                    `Not: ${item.note || '-'}`,
                ].join('\n'),
            );
        } catch {
            Alert.alert(
                'Alisveris Detayi',
                [
                    'Bu kayda ait urun verisine su an erisilemedi.',
                    `Kayit ID: ${itemId}`,
                    `Kategori: ${tx.category || '-'}`,
                    `Tutar: ₺${(tx.amountMinor / 100).toFixed(2)}`,
                    `Tarih: ${tx.occurredOn}`,
                ].join('\n'),
            );
        }
    };

    const clearFilter = () => {
        router.setParams({ startDate: undefined as any, endDate: undefined as any });
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
                        <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gelir / Gider Raporu</Text>
                    <View style={styles.headerBackBtnPlaceholder} />
                </View>
                {!externalStartDate && (
                    <View style={styles.periodRow}>
                        <PeriodBtn label="Haftalik" active={period === 'WEEKLY'} onPress={() => switchPeriod('WEEKLY')} />
                        <PeriodBtn label="Aylik" active={period === 'MONTHLY'} onPress={() => switchPeriod('MONTHLY')} />
                    </View>
                )}
                {!externalStartDate && period === 'MONTHLY' && (
                    <View style={styles.monthNavRow}>
                        <TouchableOpacity onPress={() => goMonth(-1)} style={styles.monthNavBtn}>
                            <Ionicons name="chevron-back" size={20} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.monthNavLabel}>{getMonthDates(monthOffset).label}</Text>
                        <TouchableOpacity
                            onPress={() => goMonth(1)}
                            style={[styles.monthNavBtn, monthOffset >= 0 && { opacity: 0.3 }]}
                            disabled={monthOffset >= 0}
                        >
                            <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
                {externalStartDate && (
                    <View style={styles.filterInfoRow}>
                        <Text style={styles.filterInfoText}>
                            {externalStartDate} / {externalEndDate} araligi filtrelendi
                        </Text>
                        <TouchableOpacity onPress={clearFilter} style={styles.clearFilterBtn}>
                            <Ionicons name="close-circle" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {!externalStartDate && (
                        <View style={[styles.card, isDark && styles.cardDark]}>
                            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Donem Ozet</Text>
                            <View style={styles.summaryRow}>
                                <MiniStat title="Gelir" value={currency(Number(report?.totalIncome || 0))} color="#16A34A" />
                                <MiniStat title="Gider" value={currency(Number(report?.totalExpense || 0))} color="#DC2626" />
                                <MiniStat
                                    title="Net"
                                    value={currency(Number(report?.balance || 0))}
                                    color={Number(report?.balance || 0) >= 0 ? '#16A34A' : '#DC2626'}
                                />
                            </View>
                            <View style={styles.divider} />
                            <Text style={styles.compareText}>
                                Onceki doneme gore net degisim: %{Number(report?.balanceChangePct || 0).toFixed(1)}
                            </Text>
                        </View>
                    )}

                    {!externalStartDate && (
                        <View style={[styles.card, isDark && styles.cardDark]}>
                            <Text style={[styles.cardTitle, isDark && styles.textDark]}>Trend Grafigi</Text>
                            <View style={styles.chartWrap}>
                                {(report?.buckets || []).map((b) => (
                                    <ChartGroup key={`${b.label}-${b.startDate}`} bucket={b} maxValue={chartMax} />
                                ))}
                            </View>
                            <View style={styles.chartLegendRow}>
                                <LegendDot color="#16A34A" label="Gelir" />
                                <LegendDot color="#DC2626" label="Gider" />
                            </View>
                        </View>
                    )}

                    {incomeCategories.length > 0 && (
                        <View style={[styles.card, isDark && styles.cardDark]}>
                            <TouchableOpacity
                                style={styles.cardHeader}
                                onPress={() => setIsIncomeChartExpanded(!isIncomeChartExpanded)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cardHeaderTitle}>Gelir Dağılımı</Text>
                                <Ionicons name={isIncomeChartExpanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            {isIncomeChartExpanded && (
                                <View>
                                    <View style={styles.chartBarWrapper}>
                                        {incomeCategories.map((cat, idx) => {
                                            const total = incomeCategories.reduce((sum, c) => sum + c.amount, 0);
                                            const widthPct = total > 0 ? (cat.amount / total) * 100 : 0;
                                            return widthPct > 0 ? (
                                                <View key={idx} style={[styles.chartBarSegment, { width: `${widthPct}%`, backgroundColor: cat.color }]} />
                                            ) : null;
                                        })}
                                    </View>
                                    <View style={styles.categoryList}>
                                        {incomeCategories.map((cat, idx) => {
                                            const total = incomeCategories.reduce((sum, c) => sum + c.amount, 0);
                                            const percentage = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0.0';
                                            return (
                                                <View key={idx} style={styles.categoryListItem}>
                                                    <View style={styles.categoryListLeft}>
                                                        <View style={[styles.categoryListColor, { backgroundColor: cat.color }]} />
                                                        <Text style={styles.categoryListName}>{cat.name}</Text>
                                                    </View>
                                                    <View style={styles.categoryListRight}>
                                                        <Text style={styles.categoryListPercentage}>%{percentage}</Text>
                                                        <Text style={[styles.categoryListAmount, styles.incomeText]}>
                                                            +{currency(cat.amount)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {expenseCategories.length > 0 && (
                        <View style={[styles.card, isDark && styles.cardDark]}>
                            <TouchableOpacity
                                style={styles.cardHeader}
                                onPress={() => setIsExpenseChartExpanded(!isExpenseChartExpanded)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cardHeaderTitle}>Gider Dağılımı</Text>
                                <Ionicons name={isExpenseChartExpanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                            </TouchableOpacity>
                            {isExpenseChartExpanded && (
                                <View>
                                    <View style={styles.chartBarWrapper}>
                                        {expenseCategories.map((cat, idx) => {
                                            const total = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
                                            const widthPct = total > 0 ? (cat.amount / total) * 100 : 0;
                                            return widthPct > 0 ? (
                                                <View key={idx} style={[styles.chartBarSegment, { width: `${widthPct}%`, backgroundColor: cat.color }]} />
                                            ) : null;
                                        })}
                                    </View>
                                    <View style={styles.categoryList}>
                                        {expenseCategories.map((cat, idx) => {
                                            const total = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
                                            const percentage = total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0.0';
                                            return (
                                                <View key={idx} style={styles.categoryListItem}>
                                                    <View style={styles.categoryListLeft}>
                                                        <View style={[styles.categoryListColor, { backgroundColor: cat.color }]} />
                                                        <Text style={styles.categoryListName}>{cat.name}</Text>
                                                    </View>
                                                    <View style={styles.categoryListRight}>
                                                        <Text style={styles.categoryListPercentage}>%{percentage}</Text>
                                                        <Text style={[styles.categoryListAmount, styles.expenseText]}>
                                                            -{currency(cat.amount)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={[styles.card, isDark && styles.cardDark]}>
                        <Text style={[styles.cardTitle, isDark && styles.textDark]}>Hizli Islem Ekle</Text>
                        <View style={styles.typeRow}>
                            <TypeBtn label="Gider" active={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
                            <TypeBtn label="Gelir" active={type === 'INCOME'} onPress={() => setType('INCOME')} />
                        </View>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="Tutar (₺)"
                            style={[styles.input, isDark && styles.inputDark]}
                        />
                        {type === 'INCOME' ? (
                            <View style={styles.categoryContainer}>
                                {INCOME_CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.categoryChip, category === cat && styles.incomeCatChipActive]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.categoryContainer}>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.categoryChip, category === cat && styles.expenseCatChipActive]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Not (opsiyonel)"
                            style={[styles.input, isDark && styles.inputDark]}
                        />
                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onCreateTransaction}>
                            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydi Ekle'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, isDark && styles.cardDark]}>
                        <View style={styles.txHeaderRow}>
                            <Text style={[styles.cardTitle, isDark && styles.textDark]}>
                                {externalStartDate ? 'Filtrelenmis Islemler' : 'Son Islemler'}
                            </Text>
                            {externalStartDate && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{inPeriodTransactions.length} Islem</Text>
                                </View>
                            )}
                        </View>
                        {inPeriodTransactions.length === 0 ? (
                            <Text style={styles.emptyText}>Bu aralikta islem kaydi yok.</Text>
                        ) : (
                            inPeriodTransactions.slice(0, 100).map((tx) => (
                                <TouchableOpacity
                                    key={tx.id}
                                    style={styles.txRow}
                                    activeOpacity={0.8}
                                    onPress={() => void onPressTransaction(tx)}
                                >
                                    <View style={styles.txIconWrap}>
                                        <Ionicons
                                            name={tx.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                                            size={14}
                                            color={tx.type === 'INCOME' ? '#16A34A' : '#DC2626'}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.txTitle}>{tx.category || (tx.type === 'INCOME' ? 'Gelir' : 'Gider')}</Text>
                                        <Text style={styles.txSub}>{tx.occurredOn}{tx.note ? ` | ${tx.note}` : ''}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.txAmount, tx.type === 'INCOME' ? styles.incomeText : styles.expenseText]}>
                                            {tx.type === 'INCOME' ? '+' : '-'}₺{(tx.amountMinor / 100).toFixed(2)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTransaction(tx.id)}>
                                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}

            <Toast visible={toastVisible} type={toastType} message={toastMessage} onHide={() => setToastVisible(false)} />
        </View>
    );
}

function PeriodBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity style={[styles.periodBtn, active && styles.periodBtnActive]} onPress={onPress}>
            <Text style={[styles.periodBtnText, active && styles.periodBtnTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

function TypeBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity style={[styles.typeBtn, active && styles.typeBtnActive]} onPress={onPress}>
            <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

function MiniStat({ title, value, color }: { title: string; value: string; color: string }) {
    return (
        <View style={styles.miniStat}>
            <Text style={styles.miniTitle}>{title}</Text>
            <Text style={[styles.miniValue, { color }]}>{value}</Text>
        </View>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );
}

function ChartGroup({ bucket, maxValue }: { bucket: FamilyFinanceBucket; maxValue: number }) {
    const incomeHeight = Math.max(2, (Number(bucket.income || 0) / maxValue) * 90);
    const expenseHeight = Math.max(2, (Number(bucket.expense || 0) / maxValue) * 90);

    return (
        <View style={styles.chartGroup}>
            <View style={styles.barArea}>
                <View style={[styles.bar, { height: incomeHeight, backgroundColor: '#16A34A' }]} />
                <View style={[styles.bar, { height: expenseHeight, backgroundColor: '#DC2626' }]} />
            </View>
            <Text style={styles.chartLabel}>{bucket.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: PURPLE,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 14,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerBackBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBackBtnPlaceholder: {
        width: 34,
        height: 34,
    },
    headerTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
    periodRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 16 },
    monthNavBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    monthNavLabel: { fontSize: 15, fontWeight: '700', color: '#fff', minWidth: 120, textAlign: 'center' },
    periodBtn: {
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    periodBtnActive: { backgroundColor: '#fff' },
    periodBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    periodBtnTextActive: { color: PURPLE },
    filterInfoRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        justifyContent: 'space-between',
    },
    filterInfoText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    clearFilterBtn: {
        padding: 2,
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 14, paddingBottom: 24, gap: 10 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    chartBarWrapper: { flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', marginTop: 4, marginBottom: 8 },
    chartBarSegment: { height: '100%' },
    categoryList: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
    categoryListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    categoryListLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryListColor: { width: 12, height: 12, borderRadius: 4 },
    categoryListName: { fontSize: 13, color: '#334155', fontWeight: '500' },
    categoryListRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    categoryListPercentage: { fontSize: 13, color: '#64748B', fontWeight: '600', width: 45, textAlign: 'right' },
    categoryListAmount: { fontSize: 13, fontWeight: '700', minWidth: 70, textAlign: 'right' },
    summaryRow: { flexDirection: 'row', gap: 8 },
    miniStat: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    miniTitle: { fontSize: 11, color: '#64748B' },
    miniValue: { marginTop: 3, fontSize: 13, fontWeight: '800' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
    compareText: { fontSize: 12, color: '#475569' },
    chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 120, justifyContent: 'center' },
    chartGroup: { alignItems: 'center' },
    barArea: { height: 94, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    bar: { width: 10, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    chartLabel: { marginTop: 6, fontSize: 10, color: '#64748B' },
    chartLegendRow: { marginTop: 8, flexDirection: 'row', gap: 14, justifyContent: 'center' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 10, height: 10, borderRadius: 3 },
    legendText: { fontSize: 11, color: '#64748B' },
    typeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    typeBtn: { flex: 1, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center', paddingVertical: 9 },
    typeBtnActive: { backgroundColor: PURPLE },
    typeBtnText: { fontSize: 12, fontWeight: '700', color: '#334155' },
    typeBtnTextActive: { color: '#fff' },
    input: {
        marginTop: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    saveBtn: {
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: PURPLE,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    emptyText: { fontSize: 12, color: '#64748B' },
    txHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        backgroundColor: PURPLE + '15',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: PURPLE,
    },
    txRow: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    txIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    txTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
    txSub: { marginTop: 2, fontSize: 11, color: '#64748B' },
    txAmount: { fontSize: 12, fontWeight: '800' },
    incomeText: { color: '#16A34A' },
    expenseText: { color: '#DC2626' },
    deleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    incomeCatChipActive: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    expenseCatChipActive: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    categoryTextActive: {
        color: '#fff',
    },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
}
);

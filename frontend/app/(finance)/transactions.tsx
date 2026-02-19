import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
import type {
    FamilyFinanceBucket,
    FamilyFinanceReportResponse,
    FamilyTransactionResponse,
    FamilyTransactionType,
} from '../../src/models/family.model';

const PURPLE = '#6C63FF';

type Period = 'WEEKLY' | 'MONTHLY';

const currency = (v: number) => `?${Number(v || 0).toFixed(2)}`;

export default function TransactionsScreen() {
    const [period, setPeriod] = useState<Period>('MONTHLY');
    const [report, setReport] = useState<FamilyFinanceReportResponse | null>(null);
    const [transactions, setTransactions] = useState<FamilyTransactionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [type, setType] = useState<FamilyTransactionType>('EXPENSE');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');

    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (nextType: 'success' | 'error' | 'info', message: string) => {
        setToastType(nextType);
        setToastMessage(message);
        setToastVisible(true);
    };

    const load = useCallback(async (selectedPeriod: Period) => {
        setLoading(true);
        try {
            const [reportRes, txPage] = await Promise.all([
                familyService.getTransactionsReport(selectedPeriod),
                familyService.getTransactions(0, 100),
            ]);
            setReport(reportRes);
            setTransactions(txPage.content || []);
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Rapor verisi alinamadi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void load(period);
        }, [load, period]),
    );

    const switchPeriod = (next: Period) => {
        setPeriod(next);
        void load(next);
    };

    const chartMax = useMemo(() => {
        if (!report?.buckets?.length) return 1;
        const vals = report.buckets.flatMap((b) => [Number(b.income || 0), Number(b.expense || 0)]);
        return Math.max(1, ...vals);
    }, [report?.buckets]);

    const inPeriodTransactions = useMemo(() => {
        if (!report) return [];
        return transactions
            .filter((tx) => tx.occurredOn >= report.startDate && tx.occurredOn <= report.endDate)
            .sort((a, b) => +new Date(b.occurredOn) - +new Date(a.occurredOn));
    }, [report, transactions]);

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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Gelir / Gider Raporu</Text>
                <View style={styles.periodRow}>
                    <PeriodBtn label="Haftalik" active={period === 'WEEKLY'} onPress={() => switchPeriod('WEEKLY')} />
                    <PeriodBtn label="Aylik" active={period === 'MONTHLY'} onPress={() => switchPeriod('MONTHLY')} />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={PURPLE} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Donem Ozet</Text>
                        <View style={styles.summaryRow}>
                            <MiniStat title="Gelir" value={currency(Number(report?.totalIncome || 0))} color="#16A34A" />
                            <MiniStat title="Gider" value={currency(Number(report?.totalExpense || 0))} color="#DC2626" />
                            <MiniStat
                                title="Net"
                                value={currency(Number(report?.balance || 0))}
                                color={Number(report?.balance || 0) >= 0 ? '#16A34A' : '#DC2626'}
                            />
                        </View>
                        <Text style={styles.compareText}>
                            Onceki doneme gore net degisim: %{Number(report?.balanceChangePct || 0).toFixed(1)}
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Trend Grafigi</Text>
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

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Hizli Islem Ekle</Text>
                        <View style={styles.typeRow}>
                            <TypeBtn label="Gider" active={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
                            <TypeBtn label="Gelir" active={type === 'INCOME'} onPress={() => setType('INCOME')} />
                        </View>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="Tutar (TL)"
                            style={styles.input}
                        />
                        <TextInput
                            value={category}
                            onChangeText={setCategory}
                            placeholder="Kategori (market, maas, kira...)"
                            style={styles.input}
                        />
                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Not (opsiyonel)"
                            style={styles.input}
                        />
                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onCreateTransaction}>
                            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydi Ekle'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Son Islemler</Text>
                        {inPeriodTransactions.length === 0 ? (
                            <Text style={styles.emptyText}>Bu donem icin islem kaydi yok.</Text>
                        ) : (
                            inPeriodTransactions.slice(0, 20).map((tx) => (
                                <View key={tx.id} style={styles.txRow}>
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
                                    <Text style={[styles.txAmount, tx.type === 'INCOME' ? styles.incomeText : styles.expenseText]}>
                                        {tx.type === 'INCOME' ? '+' : '-'}?{(tx.amountMinor / 100).toFixed(2)}
                                    </Text>
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteTransaction(tx.id)}>
                                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
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
    headerTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
    periodRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
    periodBtn: {
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    periodBtnActive: { backgroundColor: '#fff' },
    periodBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    periodBtnTextActive: { color: PURPLE },
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
    summaryRow: { flexDirection: 'row', gap: 8 },
    miniStat: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    miniTitle: { fontSize: 11, color: '#64748B' },
    miniValue: { marginTop: 3, fontSize: 13, fontWeight: '800' },
    compareText: { marginTop: 8, fontSize: 12, color: '#475569' },
    chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 120 },
    chartGroup: { alignItems: 'center' },
    barArea: { height: 94, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    bar: { width: 10, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    chartLabel: { marginTop: 6, fontSize: 10, color: '#64748B' },
    chartLegendRow: { marginTop: 8, flexDirection: 'row', gap: 14 },
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
        width: 24,
        height: 24,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
    },
});

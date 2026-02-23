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
import { shoppingService } from '../../services/shopping.service';
import { useShopping } from '../../src/hooks/useShopping';
import type { ShoppingListSummary } from '../../src/models/shopping.model';

const COLOR = '#F472B6';

const defaultSummary: ShoppingListSummary = {
    totalEstimatedPriceMinor: 0,
    totalCheckedPriceMinor: 0,
    totalItemCount: 0,
    checkedItemCount: 0,
};

const money = (minor?: number | null) => {
    const safeMinor = typeof minor === 'number' ? minor : 0;
    return (safeMinor / 100).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default function ListDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ listId?: string; name?: string }>();
    const listId = typeof params.listId === 'string' ? params.listId : '';
    const listName = typeof params.name === 'string' ? params.name : 'Liste Detay';

    const { selectedListItems, isLoading, fetchItems, addItem, updateItemCheck, deleteItem } = useShopping();

    const [summary, setSummary] = useState<ShoppingListSummary>(defaultSummary);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('1');
    const [newItemUnit, setNewItemUnit] = useState('adet');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [saving, setSaving] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const loadSummary = useCallback(async () => {
        if (!listId) return;
        try {
            const data = await shoppingService.getListSummary(listId);
            setSummary(data);
        } catch {
            setSummary(defaultSummary);
        }
    }, [listId]);

    const load = useCallback(async () => {
        if (!listId) return;
        try {
            await fetchItems(listId);
            await loadSummary();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Liste urunleri alinamadi.');
        }
    }, [fetchItems, listId, loadSummary]);

    useFocusEffect(
        useCallback(() => {
            void load();
        }, [load]),
    );

    const uncheckedCount = useMemo(
        () => Math.max(0, (summary.totalItemCount || 0) - (summary.checkedItemCount || 0)),
        [summary.checkedItemCount, summary.totalItemCount],
    );

    const onAddItem = async () => {
        if (!listId) return;

        const name = newItemName.trim();
        const qty = Math.max(1, Number.parseInt(newItemQty, 10) || 1);
        const unit = newItemUnit.trim();
        const normalizedPrice = newItemPrice.trim().replace(',', '.');
        const estimatedPriceMinor = normalizedPrice
            ? Math.round(Math.max(0, Number.parseFloat(normalizedPrice) || 0) * 100)
            : undefined;

        if (name.length < 2) {
            showToast('error', 'Urun adi en az 2 karakter olmali.');
            return;
        }

        setSaving(true);
        try {
            await addItem(listId, {
                name,
                quantity: qty,
                unit: unit || undefined,
                estimatedPriceMinor,
                isChecked: false,
            });
            setNewItemName('');
            setNewItemQty('1');
            setNewItemUnit('adet');
            setNewItemPrice('');
            await loadSummary();
            showToast('success', 'Urun eklendi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Urun eklenemedi.');
        } finally {
            setSaving(false);
        }
    };

    const onToggleCheck = async (itemId: string, checked: boolean) => {
        if (!listId) return;
        try {
            await updateItemCheck(listId, itemId, checked);
            await loadSummary();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Durum guncellenemedi.');
        }
    };

    const onDeleteItem = (itemId: string) => {
        if (!listId) return;

        Alert.alert('Urun sil', 'Bu urunu listeden silmek istiyor musun?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteItem(listId, itemId);
                        await loadSummary();
                        showToast('success', 'Urun silindi.');
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Urun silinemedi.');
                    }
                },
            },
        ]);
    };

    if (!listId) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyText}>Liste bilgisi bulunamadi.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{listName}</Text>
                    <TouchableOpacity onPress={() => void load()} style={styles.headerBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>{summary.totalItemCount}</Text>
                        <Text style={styles.statLabel}>Toplam urun</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>{summary.checkedItemCount}</Text>
                        <Text style={styles.statLabel}>Tamamlanan</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>{uncheckedCount}</Text>
                        <Text style={styles.statLabel}>Bekleyen</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Yeni urun ekle</Text>
                    <TextInput
                        value={newItemName}
                        onChangeText={setNewItemName}
                        placeholder="Urun adi"
                        style={styles.input}
                    />
                    <View style={styles.row}>
                        <TextInput
                            value={newItemQty}
                            onChangeText={setNewItemQty}
                            keyboardType="number-pad"
                            placeholder="Adet"
                            style={[styles.input, styles.halfInput]}
                        />
                        <TextInput
                            value={newItemUnit}
                            onChangeText={setNewItemUnit}
                            placeholder="Birim (adet, kg...)"
                            style={[styles.input, styles.halfInput]}
                        />
                    </View>
                    <TextInput
                        value={newItemPrice}
                        onChangeText={setNewItemPrice}
                        keyboardType="decimal-pad"
                        placeholder="Tahmini fiyat (TL)"
                        style={[styles.input, { marginTop: 8 }]}
                    />
                    <TouchableOpacity
                        style={[styles.addBtn, saving && { opacity: 0.75 }]}
                        onPress={onAddItem}
                        disabled={saving}
                    >
                        <Text style={styles.addBtnText}>{saving ? 'Ekleniyor...' : 'Urun Ekle'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Liste urunleri</Text>

                    {isLoading ? (
                        <View style={styles.loadingInline}>
                            <ActivityIndicator size="small" color={COLOR} />
                        </View>
                    ) : selectedListItems.length === 0 ? (
                        <Text style={styles.emptySub}>Bu listede henuz urun yok.</Text>
                    ) : (
                        selectedListItems.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                                <TouchableOpacity
                                    style={styles.itemCheckBtn}
                                    onPress={() => void onToggleCheck(item.id, !item.isChecked)}
                                >
                                    <Ionicons
                                        name={item.isChecked ? 'checkbox' : 'square-outline'}
                                        size={22}
                                        color={item.isChecked ? '#16A34A' : '#64748B'}
                                    />
                                </TouchableOpacity>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, item.isChecked && styles.itemNameDone]}>{item.name}</Text>
                                    <Text style={styles.itemMeta}>
                                        {item.quantity} {item.unit || 'adet'}
                                        {typeof item.estimatedPriceMinor === 'number'
                                            ? `  |  ${money(item.estimatedPriceMinor)} TL`
                                            : ''}
                                    </Text>
                                    {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                                </View>

                                <TouchableOpacity style={styles.itemDeleteBtn} onPress={() => onDeleteItem(item.id)}>
                                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ozet</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tahmini toplam:</Text>
                        <Text style={styles.summaryValue}>{money(summary.totalEstimatedPriceMinor)} TL</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Secili urun tutari:</Text>
                        <Text style={styles.summaryValue}>{money(summary.totalCheckedPriceMinor)} TL</Text>
                    </View>
                </View>
            </ScrollView>

            <Toast
                visible={toastVisible}
                type={toastType}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 15, color: '#64748B', fontWeight: '700' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 18,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { flex: 1, textAlign: 'center', marginHorizontal: 8, fontSize: 18, fontWeight: '800', color: '#fff' },
    statsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14, gap: 18 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
    content: { padding: 14, paddingBottom: 22, gap: 10 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
    },
    row: { flexDirection: 'row', gap: 8, marginTop: 8 },
    halfInput: { flex: 1 },
    addBtn: {
        marginTop: 10,
        borderRadius: 12,
        backgroundColor: COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
    },
    addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    loadingInline: { paddingVertical: 12, alignItems: 'center' },
    emptySub: { fontSize: 12, color: '#64748B', paddingVertical: 6 },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
        marginTop: 10,
    },
    itemCheckBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    itemNameDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
    itemMeta: { marginTop: 2, fontSize: 12, color: '#64748B' },
    itemNote: { marginTop: 3, fontSize: 12, color: '#475569' },
    itemDeleteBtn: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    summaryLabel: { fontSize: 13, color: '#475569' },
    summaryValue: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
});
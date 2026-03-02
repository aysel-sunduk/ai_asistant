// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import type { ShoppingItem, ShoppingRecurrenceType } from '../../src/models/shopping.model';

const COLOR = '#F472B6';
const DATE_FILTERS: { key: ShoppingRecurrenceType | 'ALL' | 'ARCHIVED'; label: string }[] = [
    { key: 'DAILY', label: 'Gunluk' },
    { key: 'WEEKLY', label: 'Haftalik' },
    { key: 'MONTHLY', label: 'Aylik' },
    { key: 'ALL', label: 'Tumu' },
    { key: 'ARCHIVED', label: 'Arsiv' },
];

const isInCurrentPeriod = (dateStr: string, period: ShoppingRecurrenceType | 'ALL' | 'ARCHIVED') => {
    if (period === 'ALL' || period === 'ARCHIVED') return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (Number.isNaN(d.getTime())) return false;

    if (period === 'DAILY') {
        return d.toDateString() === now.toDateString();
    }
    if (period === 'WEEKLY') {
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(now.getDate() + mondayOffset);
        return d >= weekStart;
    }
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export default function ListsScreen() {
    const router = useRouter();
    const { lists, isLoading, fetchLists, createList, deleteList, updateListArchive } = useShopping();

    const [newListName, setNewListName] = useState('');
    const [dateFilter, setDateFilter] = useState<ShoppingRecurrenceType | 'ALL' | 'ARCHIVED'>('WEEKLY');
    const [overviewTab, setOverviewTab] = useState<'PENDING' | 'DONE'>('PENDING');
    const [allPendingItems, setAllPendingItems] = useState<ShoppingItem[]>([]);
    const [allDoneItems, setAllDoneItems] = useState<ShoppingItem[]>([]);
    const [creating, setCreating] = useState(false);
    const [loadingOverview, setLoadingOverview] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    const loadData = useCallback(async () => {
        setLoadingOverview(true);
        try {
            await fetchLists();
            const freshLists = await shoppingService.getLists();
            const allItemsNested = await Promise.all(freshLists.map((list) => shoppingService.getItems(list.id)));
            const allItems = allItemsNested.flat();
            setAllPendingItems(allItems.filter((i) => !i.isChecked));
            setAllDoneItems(allItems.filter((i) => i.isChecked));
        } catch {
            setAllPendingItems([]);
            setAllDoneItems([]);
        } finally {
            setLoadingOverview(false);
        }
    }, [fetchLists]);

    useFocusEffect(
        useCallback(() => {
            void loadData();
        }, [loadData]),
    );

    const stats = useMemo(() => {
        const archived = lists.filter((l) => l.isArchived).length;
        return {
            total: lists.length,
            active: lists.length - archived,
            archived,
        };
    }, [lists]);

    const onCreateList = async () => {
        const name = newListName.trim();
        if (name.length < 2) {
            showToast('error', 'Liste adi en az 2 karakter olmali.');
            return;
        }

        setCreating(true);
        try {
            await createList({
                name,
                recurrenceType: (dateFilter === 'ALL' || dateFilter === 'ARCHIVED') ? 'WEEKLY' : dateFilter
            });
            setNewListName('');
            await loadData();
            showToast('success', 'Liste olusturuldu.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Liste olusturulamadi.');
        } finally {
            setCreating(false);
        }
    };

    const onDeleteList = (id: string) => {
        Alert.alert('Liste sil', 'Bu listeyi silmek istiyor musun?', [
            { text: 'Iptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteList(id);
                        await loadData();
                        showToast('success', 'Liste silindi.');
                    } catch (error: any) {
                        showToast('error', error?.response?.data?.message || 'Liste silinemedi.');
                    }
                },
            },
        ]);
    };

    const onToggleArchive = async (id: string, archived: boolean) => {
        try {
            await updateListArchive(id, archived);
            await loadData();
            showToast('success', archived ? 'Liste arsive alindi.' : 'Liste arsivden cikarildi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Arsiv durumu guncellenemedi.');
        }
    };

    const onOverviewToggleCheck = async (item: ShoppingItem) => {
        try {
            await shoppingService.updateItemCheck(item.listId, item.id, !item.isChecked);
            await loadData();
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Urun durumu guncellenemedi.');
        }
    };

    const onOpenItemList = (item: ShoppingItem) => {
        const list = lists.find((l) => l.id === item.listId);
        router.push({
            pathname: '/(shopping)/list-detail',
            params: { listId: item.listId, name: list?.name || 'Liste Detay' },
        });
    };

    const filteredLists = useMemo(
        () => lists.filter((list) => {
            if (dateFilter === 'ARCHIVED') {
                return list.isArchived;
            }
            const periodMatch = isInCurrentPeriod(list.createdAt, dateFilter);
            return periodMatch && !list.isArchived;
        }),
        [dateFilter, lists],
    );

    const recurrenceBadgeLabel = (recurrenceType?: string) => {
        const found = DATE_FILTERS.find((r) => r.key === (recurrenceType as any));
        return found ? found.label : 'Haftalik';
    };
    const overviewItems = overviewTab === 'PENDING' ? allPendingItems : allDoneItems;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Alisveris</Text>
                    <TouchableOpacity onPress={() => void loadData()} style={styles.headerBtn}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Toplam</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>{stats.active}</Text>
                        <Text style={styles.statLabel}>Aktif</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statNum}>{stats.archived}</Text>
                        <Text style={styles.statLabel}>Arsiv</Text>
                    </View>
                </View>

                <View style={styles.createRow}>
                    <TextInput
                        value={newListName}
                        onChangeText={setNewListName}
                        placeholder="Yeni liste adi"
                        placeholderTextColor="rgba(255,255,255,0.75)"
                        style={styles.createInput}
                    />
                    <TouchableOpacity
                        onPress={onCreateList}
                        disabled={creating}
                        style={[styles.createButton, creating && { opacity: 0.7 }]}
                    >
                        <Text style={styles.createButtonText}>{creating ? '...' : 'Ekle'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.recurrenceRow}>
                    {DATE_FILTERS.map((opt) => {
                        const active = dateFilter === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                style={[styles.recurrenceBtn, active && styles.recurrenceBtnActive]}
                                onPress={() => setDateFilter(opt.key)}
                            >
                                <Text style={[styles.recurrenceBtnText, active && styles.recurrenceBtnTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={COLOR} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Genel Urun Durumu</Text>
                        <View style={styles.overviewTabs}>
                            <TouchableOpacity
                                style={[styles.overviewTabBtn, overviewTab === 'PENDING' && styles.overviewTabBtnActive]}
                                onPress={() => setOverviewTab('PENDING')}
                            >
                                <Text style={[styles.overviewTabText, overviewTab === 'PENDING' && styles.overviewTabTextActive]}>
                                    Alinacaklar ({allPendingItems.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.overviewTabBtn, overviewTab === 'DONE' && styles.overviewTabBtnActive]}
                                onPress={() => setOverviewTab('DONE')}
                            >
                                <Text style={[styles.overviewTabText, overviewTab === 'DONE' && styles.overviewTabTextActive]}>
                                    Alinanlar ({allDoneItems.length})
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {loadingOverview ? (
                            <View style={styles.loadingInline}>
                                <ActivityIndicator size="small" color={COLOR} />
                            </View>
                        ) : overviewItems.length === 0 ? (
                            <Text style={styles.emptySub}>
                                {overviewTab === 'PENDING' ? 'Bekleyen urun yok.' : 'Alinan urun yok.'}
                            </Text>
                        ) : (
                            overviewItems.slice(0, 6).map((item) => (
                                <View key={item.id} style={styles.overviewRow}>
                                    <TouchableOpacity
                                        style={styles.overviewCheckBtn}
                                        onPress={() => void onOverviewToggleCheck(item)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons
                                            name={item.isChecked ? 'checkbox' : 'square-outline'}
                                            size={18}
                                            color={item.isChecked ? '#16A34A' : '#64748B'}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                        activeOpacity={0.8}
                                        onPress={() => onOpenItemList(item)}
                                    >
                                        <Text style={styles.overviewItemName}>{item.name}</Text>
                                        <Text style={styles.overviewItemMeta}>
                                            {item.quantity} {item.unit || 'adet'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>

                    {lists.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>Henuz liste yok</Text>
                            <Text style={styles.emptySub}>Yukaridan yeni bir alisveris listesi olusturabilirsin.</Text>
                        </View>
                    ) : (
                        <View style={styles.sectionWrap}>
                            <Text style={styles.sectionTitle}>
                                {dateFilter === 'DAILY' ? 'Bugun' : dateFilter === 'WEEKLY' ? 'Bu Hafta' : dateFilter === 'MONTHLY' ? 'Bu Ay' : 'Tum'} Listeleri
                            </Text>
                            {filteredLists.length === 0 ? (
                                <Text style={styles.emptySub}>Secili tarih araliginda liste bulunamadi.</Text>
                            ) : (
                                filteredLists.map((list) => (
                                    <TouchableOpacity
                                        key={list.id}
                                        style={styles.card}
                                        activeOpacity={0.75}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/(shopping)/list-detail',
                                                params: { listId: list.id, name: list.name },
                                            })
                                        }
                                    >
                                        <View style={styles.cardTop}>
                                            <View style={styles.iconBox}>
                                                <Ionicons name="cart-outline" size={20} color={COLOR} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.cardTitle}>{list.name}</Text>
                                                <Text style={styles.cardSub}>
                                                    {new Date(list.createdAt).toLocaleString('tr-TR')}
                                                </Text>
                                            </View>
                                            <View style={{ gap: 6, alignItems: 'flex-end' }}>
                                                <View style={[styles.statusBadge, list.isArchived && styles.statusBadgeMuted]}>
                                                    <Text style={[styles.statusBadgeText, list.isArchived && styles.statusBadgeTextMuted]}>
                                                        {list.isArchived ? 'Arsiv' : 'Aktif'}
                                                    </Text>
                                                </View>
                                                <View style={styles.recurrenceTag}>
                                                    <Text style={styles.recurrenceTagText}>{recurrenceBadgeLabel(list.recurrenceType)}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.cardActions}>
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: '/(shopping)/list-detail',
                                                        params: { listId: list.id, name: list.name },
                                                    })
                                                }
                                            >
                                                <Ionicons name="open-outline" size={14} color="#475569" />
                                                <Text style={styles.actionText}>Ac</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() => void onToggleArchive(list.id, !list.isArchived)}
                                            >
                                                <Ionicons
                                                    name={list.isArchived ? 'archive-outline' : 'file-tray-outline'}
                                                    size={14}
                                                    color="#475569"
                                                />
                                                <Text style={styles.actionText}>{list.isArchived ? 'Cikar' : 'Arsivle'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.actionBtnDanger} onPress={() => onDeleteList(list.id)}>
                                                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                                                <Text style={styles.actionDangerText}>Sil</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}
                </ScrollView>
            )
            }

            <Toast
                visible={toastVisible}
                type={toastType}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: COLOR,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        paddingBottom: 18,
        shadowColor: COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 14, gap: 18 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
    createRow: {
        marginTop: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recurrenceRow: {
        marginTop: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 8,
    },
    recurrenceBtn: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    recurrenceBtnActive: {
        backgroundColor: '#fff',
    },
    recurrenceBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    recurrenceBtnTextActive: {
        color: COLOR,
    },
    createInput: {
        flex: 1,
        height: 42,
        borderRadius: 11,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    createButton: {
        height: 42,
        minWidth: 66,
        borderRadius: 11,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
    },
    createButtonText: { color: COLOR, fontWeight: '800', fontSize: 13 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingInline: { paddingVertical: 8, alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 28 },
    sectionWrap: { marginBottom: 4 },
    sectionTitle: { marginBottom: 8, fontSize: 13, fontWeight: '800', color: '#475569' },
    emptyCard: {
        marginTop: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    emptySub: { marginTop: 4, fontSize: 12, color: '#64748B' },
    overviewTabs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    overviewTabBtn: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    overviewTabBtnActive: {
        backgroundColor: '#FDF2F8',
        borderWidth: 1,
        borderColor: '#FBCFE8',
    },
    overviewTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    overviewTabTextActive: {
        color: COLOR,
    },
    overviewRow: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 6,
    },
    overviewCheckBtn: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overviewItemName: { flex: 1, fontSize: 13, fontWeight: '700', color: '#0F172A' },
    overviewItemMeta: { fontSize: 12, color: '#64748B' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#FDF2F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    cardSub: { marginTop: 2, fontSize: 12, color: '#64748B' },
    statusBadge: {
        borderRadius: 999,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusBadgeMuted: { backgroundColor: '#F1F5F9' },
    statusBadgeText: { fontSize: 11, color: '#047857', fontWeight: '700' },
    statusBadgeTextMuted: { color: '#475569' },
    recurrenceTag: {
        borderRadius: 999,
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    recurrenceTagText: {
        color: COLOR,
        fontSize: 10,
        fontWeight: '800',
    },
    cardActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    actionBtnDanger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    actionText: { fontSize: 12, color: '#475569', fontWeight: '700' },
    actionDangerText: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
    archiveToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        gap: 6,
    },
    archiveToggleActive: {
        backgroundColor: '#fff',
    },
    archiveToggleText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    archiveToggleTextActive: {
        color: COLOR,
    },
});

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
import { useShopping } from '../../src/hooks/useShopping';

const COLOR = '#F472B6';

export default function ListsScreen() {
    const router = useRouter();
    const { lists, isLoading, fetchLists, createList, deleteList, updateListArchive } = useShopping();

    const [newListName, setNewListName] = useState('');
    const [creating, setCreating] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToastType(type);
        setToastMessage(message);
        setToastVisible(true);
    };

    useFocusEffect(
        useCallback(() => {
            void fetchLists();
        }, [fetchLists]),
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
            await createList({ name });
            setNewListName('');
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
            showToast('success', archived ? 'Liste arsive alindi.' : 'Liste arsivden cikarildi.');
        } catch (error: any) {
            showToast('error', error?.response?.data?.message || 'Arsiv durumu guncellenemedi.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Alisveris</Text>
                    <TouchableOpacity onPress={() => void fetchLists()} style={styles.headerBtn}>
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
            </View>

            {isLoading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={COLOR} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {lists.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>Henuz liste yok</Text>
                            <Text style={styles.emptySub}>Yukaridan yeni bir alisveris listesi olusturabilirsin.</Text>
                        </View>
                    ) : (
                        lists.map((list) => (
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
                                    <View style={[styles.statusBadge, list.isArchived && styles.statusBadgeMuted]}>
                                        <Text style={[styles.statusBadgeText, list.isArchived && styles.statusBadgeTextMuted]}>
                                            {list.isArchived ? 'Arsiv' : 'Aktif'}
                                        </Text>
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
                </ScrollView>
            )}

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
    scroll: { padding: 16, paddingBottom: 28 },
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
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { financeService } from '../../services/finance.service';
import type { InvestmentRequest } from '../../src/models/finance.model';
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../../src/models/finance.model';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const ASSET_TYPES = ['STOCK', 'CRYPTO', 'FUND', 'GOLD', 'COMMODITY', 'OTHER'];

export default function AddInvestmentScreen() {
    const router = useRouter();
    const [assetType, setAssetType] = useState('STOCK');
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [avgCost, setAvgCost] = useState('');
    const [currency, setCurrency] = useState('TRY');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!symbol.trim()) {
            Alert.alert('Hata', 'Sembol alanı zorunludur');
            return;
        }
        if (!quantity.trim() || Number(quantity) <= 0) {
            Alert.alert('Hata', 'Geçerli bir miktar girin');
            return;
        }

        setLoading(true);
        try {
            const data: InvestmentRequest = {
                assetType,
                symbol: symbol.trim().toUpperCase(),
                quantity: Number(quantity),
                avgCostMinor: avgCost ? Math.round(Number(avgCost) * 100) : undefined,
                currency: currency || 'TRY',
            };
            await financeService.addInvestment(data);
            Alert.alert('Başarılı', 'Yatırım başarıyla eklendi', [
                { text: 'Tamam', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Hata', err?.response?.data?.message || 'Yatırım eklenemedi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Yatırım Ekle</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Asset Type Picker */}
                    <Text style={styles.label}>Yatırım Türü</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {ASSET_TYPES.map((type) => {
                            const selected = assetType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeChip, selected && { backgroundColor: ASSET_TYPE_COLORS[type] }]}
                                    onPress={() => setAssetType(type)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={(ASSET_TYPE_ICONS[type] || 'ellipsis-horizontal') as IoniconsName}
                                        size={16}
                                        color={selected ? '#fff' : ASSET_TYPE_COLORS[type]}
                                    />
                                    <Text style={[styles.typeChipText, selected && { color: '#fff' }]}>
                                        {ASSET_TYPE_LABELS[type]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Symbol */}
                    <Text style={styles.label}>Sembol</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="search" size={18} color={GRAY} />
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: AAPL, BTC, GLDTR"
                            placeholderTextColor="#C4C4C4"
                            value={symbol}
                            onChangeText={setSymbol}
                            autoCapitalize="characters"
                        />
                    </View>

                    {/* Quantity */}
                    <Text style={styles.label}>Miktar</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="layers-outline" size={18} color={GRAY} />
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="#C4C4C4"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Avg Cost */}
                    <Text style={styles.label}>Ortalama Maliyet (birim fiyat)</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>₺</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor="#C4C4C4"
                            value={avgCost}
                            onChangeText={setAvgCost}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Currency */}
                    <Text style={styles.label}>Para Birimi</Text>
                    <View style={styles.currencyRow}>
                        {['TRY', 'USD', 'EUR'].map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                                onPress={() => setCurrency(c)}
                            >
                                <Text style={[styles.currencyChipText, currency === c && styles.currencyChipTextActive]}>
                                    {c}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Preview */}
                    {symbol && quantity ? (
                        <View style={styles.preview}>
                            <Text style={styles.previewTitle}>Özet</Text>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Tür</Text>
                                <Text style={styles.previewValue}>{ASSET_TYPE_LABELS[assetType]}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Sembol</Text>
                                <Text style={styles.previewValue}>{symbol.toUpperCase()}</Text>
                            </View>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Miktar</Text>
                                <Text style={styles.previewValue}>{quantity}</Text>
                            </View>
                            {avgCost ? (
                                <View style={styles.previewRow}>
                                    <Text style={styles.previewLabel}>Toplam Maliyet</Text>
                                    <Text style={[styles.previewValue, { fontWeight: '800' }]}>
                                        ₺{(Number(quantity) * Number(avgCost)).toFixed(2)}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text style={styles.submitText}>
                            {loading ? 'Ekleniyor...' : 'Yatırım Ekle'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },

    /* Header */
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },

    /* Form */
    form: { padding: 24, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', marginBottom: 8, marginTop: 20, letterSpacing: 0.2 },

    /* Type Picker */
    typeScroll: { marginBottom: 4 },
    typeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#fff', marginRight: 8,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    typeChipText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

    /* Inputs */
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    input: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
    currencySymbol: { fontSize: 16, fontWeight: '700', color: PURPLE },

    /* Currency */
    currencyRow: { flexDirection: 'row', gap: 10 },
    currencyChip: {
        flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0F0F0',
    },
    currencyChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
    currencyChipText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
    currencyChipTextActive: { color: '#fff' },

    /* Preview */
    preview: {
        marginTop: 28, backgroundColor: '#fff', borderRadius: 18, padding: 20,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    previewTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    previewLabel: { fontSize: 13, color: GRAY },
    previewValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

    /* Submit */
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16, marginTop: 28,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
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
import type { CurrencyHoldingRequest, InvestmentRequest } from '../../src/models/finance.model';
import { ASSET_TYPE_COLORS, ASSET_TYPE_ICONS, ASSET_TYPE_LABELS } from '../../src/models/finance.model';
import { useThemeStore, resolveTheme } from '../../src/store/theme.store';
import { useFinanceStore } from '../../src/store/finance.store';
import { useColorScheme } from '../../hooks/use-color-scheme';

const PURPLE = '#6C63FF';
const GRAY = '#9BA1A6';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Add CURRENCY to the list. Restricted to CURRENCY, GOLD, SILVER, OTHER as per user request.
const ASSET_TYPES = ['CURRENCY', 'GOLD', 'SILVER', 'OTHER'];

// Add label/icon/color for CURRENCY if not in model
const EXTENDED_LABELS: Record<string, string> = { ...ASSET_TYPE_LABELS, CURRENCY: 'Döviz' };
const EXTENDED_ICONS: Record<string, string> = { ...ASSET_TYPE_ICONS, CURRENCY: 'cash' };
const EXTENDED_COLORS: Record<string, string> = { ...ASSET_TYPE_COLORS, CURRENCY: '#22C55E' };

const GOLD_TYPES = [
    { code: 'GOLD_GRAM', label: 'Gram Altın' },
    { code: 'GOLD_CEYREK', label: 'Çeyrek Altın' },
    { code: 'GOLD_YARIM', label: 'Yarım Altın' },
    { code: 'GOLD_CUMHURIYET', label: 'Cumhuriyet Altını' },
    { code: 'GOLD_ATA', label: 'Ata Altın' },
];

const CURRENCY_TYPES = [
    { code: 'USD', label: 'Amerikan Doları' },
    { code: 'EUR', label: 'Euro' },
    { code: 'GBP', label: 'İngiliz Sterlini' },
    { code: 'CHF', label: 'İsviçre Frangı' },
    { code: 'CAD', label: 'Kanada Doları' },

];

export default function AddTransactionScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const router = useRouter();
    const [assetType, setAssetType] = useState('STOCK');
    const [symbol, setSymbol] = useState('');
    const [goldType, setGoldType] = useState('GOLD_GRAM');
    const [currencyType, setCurrencyType] = useState('USD');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState('');
    const [currency, setCurrency] = useState('TRY');
    const [loading, setLoading] = useState(false);

    const isCurrency = assetType === 'CURRENCY';
    const isGold = assetType === 'GOLD';
    const isSilver = assetType === 'SILVER';
    const isOther = assetType === 'OTHER';
    // Commodity check is now split into isGold / isSilver for specific handling
    const isCommodity = isGold || isSilver;

    const handleSubmit = async () => {
        let finalSymbol = symbol;

        if (isGold) {
            finalSymbol = goldType;
        } else if (isSilver) {
            finalSymbol = 'SILVER_GRAM';
        } else if (isCurrency) {
            finalSymbol = currencyType;
        }

        // Sanitize inputs (replace comma with dot)
        const cleanQuantity = quantity.replace(',', '.');
        const cleanCost = cost.replace(',', '.');
        const qtyNum = Number(cleanQuantity);
        const costNum = Number(cleanCost);

        if (!finalSymbol.trim()) {
            Alert.alert('Hata', isOther ? 'Varlık adı zorunludur' : 'Sembol alanı zorunludur');
            return;
        }
        if (!cleanQuantity.trim() || isNaN(qtyNum) || qtyNum <= 0) {
            Alert.alert('Hata', 'Geçerli bir miktar girin');
            return;
        }
        if (cost && (isNaN(costNum) || costNum < 0)) {
            Alert.alert('Hata', 'Geçerli bir fiyat girin');
            return;
        }

        setLoading(true);
        try {
            // Unifying submission logic to use addInvestment for all types (including CURRENCY)
            // This ensures we satisfy the backend validation for 'quantity' and 'avgCostMinor'.

            const data: InvestmentRequest = {
                assetType: isCurrency ? 'CURRENCY' : assetType,
                symbol: finalSymbol.trim(),
                quantity: qtyNum,
                // Backend requires avgCostMinor. If cost is not provided, we send 0.
                avgCostMinor: cost ? Math.round(costNum * 100) : 0,
                // For currency assets (e.g. USD), the 'currency' field represents what we paid with (usually TRY).
                // Or if the backend expects the base currency of the user.
                currency: currency || 'TRY',
            };

            if (!isOther && !isCurrency) {
                // Uppercase symbol for Stocks/Crypto etc.
                // For currency, symbol comes from selection which is already uppercased usually.
                data.symbol = data.symbol.toUpperCase();
            }

            console.log('[AddTransaction] Investment Payload:', JSON.stringify(data, null, 2));
            
            // 1. Add the investment (synchronous backend call)
            await financeService.addInvestment(data);

            // 2. Refresh the global finance store immediately to reflect changes
            // We AWAIT this so the data is ready before we go back
            try {
                await useFinanceStore.getState().fetchDashboardData();
            } catch (e) {
                console.error('Store refresh failed', e);
            }

            Alert.alert('Başarılı', isCurrency ? 'Döviz varlığı eklendi' : 'Yatırım başarıyla eklendi', [
                { text: 'Tamam', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Hata', err?.response?.data?.message || 'İşlem başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
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
                    <Text style={[styles.headerTitle, isDark && styles.textDark]}>{isCurrency ? 'Döviz Ekle' : isCommodity ? 'Emtia Ekle' : isOther ? 'Varlık Ekle' : 'Yatırım Ekle'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                    {/* Asset Type Picker */}
                    <Text style={[styles.label, isDark && styles.subTextDark]}>Tür</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {ASSET_TYPES.map((type) => {
                            const selected = assetType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeChip, selected && { backgroundColor: EXTENDED_COLORS[type] }]}
                                    onPress={() => setAssetType(type)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={(EXTENDED_ICONS[type] || 'ellipsis-horizontal') as IoniconsName}
                                        size={16}
                                        color={selected ? '#fff' : EXTENDED_COLORS[type]}
                                    />
                                    <Text style={[styles.typeChipText, selected && { color: '#fff' }]}>
                                        {EXTENDED_LABELS[type]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Symbol Selection */}
                    {isGold ? (
                        <>
                            <Text style={[styles.label, isDark && styles.subTextDark]}>Altın Tipi</Text>
                            <View style={styles.goldTypeContainer}>
                                {GOLD_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.code}
                                        style={[styles.goldTypeChip, goldType === type.code && styles.goldTypeChipActive]}
                                        onPress={() => setGoldType(type.code)}
                                    >
                                        <Text style={[styles.goldTypeText, goldType === type.code && styles.goldTypeTextActive]}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : isSilver ? (
                        <>
                            <Text style={[styles.label, isDark && styles.subTextDark]}>Gümüş Tipi</Text>
                            <View style={styles.readOnlyContainer}>
                                <Ionicons name="medal-outline" size={18} color={GRAY} />
                                <Text style={styles.readOnlyText}>Gram Gümüş</Text>
                            </View>
                        </>
                    ) : isCurrency ? (
                        <>
                            <Text style={[styles.label, isDark && styles.subTextDark]}>Para Birimi</Text>
                            <View style={styles.goldTypeContainer}>
                                {CURRENCY_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.code}
                                        style={[styles.goldTypeChip, currencyType === type.code && styles.goldTypeChipActive]}
                                        onPress={() => setCurrencyType(type.code)}
                                    >
                                        <Text style={[styles.goldTypeText, currencyType === type.code && styles.goldTypeTextActive]}>
                                            {type.code}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.label, isDark && styles.subTextDark]}>{isOther ? 'Varlık Adı (Örn: Arsa, Saat)' : 'Sembol'}</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name={isOther ? 'pricetag-outline' : 'search'} size={18} color={GRAY} />
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    placeholder={isOther ? "Varlık adı girin" : "Sembol girin"}
                                    placeholderTextColor="#C4C4C4"
                                    value={symbol}
                                    onChangeText={setSymbol}
                                    autoCapitalize={isOther ? "sentences" : "characters"}
                                />
                            </View>
                        </>
                    )}

                    {/* Quantity */}
                    <Text style={[styles.label, isDark && styles.subTextDark]}>Miktar</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="layers-outline" size={18} color={GRAY} />
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            placeholder="0.00"
                            placeholderTextColor="#C4C4C4"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Cost / Rate */}
                    <Text style={[styles.label, isDark && styles.subTextDark]}>{isCurrency ? 'Alış Kuru (Opsiyonel)' : 'Ortalama Maliyet (Birim Fiyat)'}</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>₺</Text>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            placeholder="0.00"
                            placeholderTextColor="#C4C4C4"
                            value={cost}
                            onChangeText={setCost}
                            keyboardType="decimal-pad"
                        />
                    </View>

                    {/* Currency Selection (Only for Investments) */}
                    {!isCurrency && (
                        <>
                            <Text style={[styles.label, isDark && styles.subTextDark]}>İşlem Para Birimi</Text>
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
                        </>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && { opacity: 0.6 }, isCurrency && { backgroundColor: EXTENDED_COLORS.CURRENCY }]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text style={styles.submitText}>
                            {loading ? 'Ekleniyor...' : isCurrency ? 'Döviz Ekle' : 'Yatırım Ekle'}
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

    /* Submit */
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16, marginTop: 28,
        shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    /* Gold Types */
    goldTypeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    goldTypeChip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0F0F0',
    },
    goldTypeChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
    goldTypeText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
    goldTypeTextActive: { color: '#fff' },

    /* Read Only */
    readOnlyContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        borderWidth: 1, borderColor: '#E0E0E0',
    },
    readOnlyText: { fontSize: 15, fontWeight: '500', color: GRAY },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});
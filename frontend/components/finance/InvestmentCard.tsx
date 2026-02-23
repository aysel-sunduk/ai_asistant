// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Investment } from '../../src/models/finance.model';
import { formatCurrency } from '../../src/utils/format';
import Card from '../ui/Card';

interface Props { investment: Investment; onPress?: () => void; }

export default function InvestmentCard({ investment, onPress }: Props) {
    const profit = investment.currentPrice - investment.buyPrice;
    const profitPercent = ((profit / investment.buyPrice) * 100).toFixed(2);
    const isPositive = profit >= 0;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <Text style={styles.name}>{investment.name}</Text>
                {investment.symbol && <Text style={styles.symbol}>{investment.symbol}</Text>}
                <View style={styles.row}>
                    <Text style={styles.price}>{formatCurrency(investment.currentPrice, investment.currency)}</Text>
                    <Text style={[styles.profit, { color: isPositive ? '#4ECDC4' : '#FF6B6B' }]}>
                        {isPositive ? '+' : ''}{profitPercent}%
                    </Text>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    name: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    symbol: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    price: { fontSize: 18, fontWeight: '700', color: '#11181C' },
    profit: { fontSize: 14, fontWeight: '600' },
});
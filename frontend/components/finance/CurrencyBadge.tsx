// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props { code: string; rate: number; change?: number; }

export default function CurrencyBadge({ code, rate, change }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.code}>{code}</Text>
            <Text style={styles.rate}>{rate.toFixed(4)}</Text>
            {change !== undefined && (
                <Text style={[styles.change, { color: change >= 0 ? '#4ECDC4' : '#FF6B6B' }]}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F8F9FA', borderRadius: 10 },
    code: { fontSize: 14, fontWeight: '700', color: '#6C63FF' },
    rate: { fontSize: 14, fontWeight: '600', color: '#11181C' },
    change: { fontSize: 12, fontWeight: '500' },
});
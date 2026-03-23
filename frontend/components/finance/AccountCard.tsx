// @ts-nocheck
// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { FinanceAccount } from '../../src/models/finance.model';
import { formatCurrency } from '../../src/utils/format';
import Card from '../ui/Card';

interface Props { account: FinanceAccount; onPress?: () => void; }

export default function AccountCard({ account, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={styles.card}>
                <Text style={styles.name}>{account.name}</Text>
                <Text style={styles.type}>{account.type}</Text>
                <Text style={styles.balance}>{formatCurrency(account.balance, account.currency)}</Text>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: { minWidth: 160 },
    name: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    type: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
    balance: { fontSize: 20, fontWeight: '700', color: '#6C63FF', marginTop: 8 },
});
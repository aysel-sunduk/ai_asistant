import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FinanceTransaction } from '../../src/models/finance.model';
import { formatCurrency, formatDate } from '../../src/utils/format';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

interface Props { transaction: FinanceTransaction; onPress?: () => void; }

export default function TransactionCard({ transaction, onPress }: Props) {
    const isIncome = transaction.type === 'income';
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <View style={styles.row}>
                    <View style={styles.info}>
                        <Text style={styles.desc}>{transaction.description || 'İşlem'}</Text>
                        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
                    </View>
                    <View style={styles.right}>
                        <Text style={[styles.amount, { color: isIncome ? '#4ECDC4' : '#FF6B6B' }]}>
                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                        </Text>
                        <Badge label={isIncome ? 'Gelir' : 'Gider'} color={isIncome ? '#E8FFF5' : '#FFF0F0'} textColor={isIncome ? '#4ECDC4' : '#FF6B6B'} />
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    info: { flex: 1 },
    desc: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    date: { fontSize: 12, color: '#9BA1A6', marginTop: 4 },
    right: { alignItems: 'flex-end', gap: 4 },
    amount: { fontSize: 16, fontWeight: '700' },
});

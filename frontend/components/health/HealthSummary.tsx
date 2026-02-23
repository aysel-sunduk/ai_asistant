// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../ui/Card';

interface Props {
    waterPercent: number;
    exerciseMinutes: number;
    mealCount: number;
}

export default function HealthSummary({ waterPercent, exerciseMinutes, mealCount }: Props) {
    return (
        <Card>
            <Text style={styles.title}>Günlük Özet</Text>
            <View style={styles.row}>
                <View style={styles.item}>
                    <Text style={styles.icon}>💧</Text>
                    <Text style={styles.value}>{waterPercent}%</Text>
                    <Text style={styles.label}>Su</Text>
                </View>
                <View style={styles.item}>
                    <Text style={styles.icon}>🏃</Text>
                    <Text style={styles.value}>{exerciseMinutes}dk</Text>
                    <Text style={styles.label}>Egzersiz</Text>
                </View>
                <View style={styles.item}>
                    <Text style={styles.icon}>🍽️</Text>
                    <Text style={styles.value}>{mealCount}</Text>
                    <Text style={styles.label}>Öğün</Text>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-around' },
    item: { alignItems: 'center' },
    icon: { fontSize: 24, marginBottom: 4 },
    value: { fontSize: 18, fontWeight: '700', color: '#6C63FF' },
    label: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
});
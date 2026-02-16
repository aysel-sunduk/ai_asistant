import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { HealthLog } from '../../src/models/health.model';
import Card from '../ui/Card';

interface Props { log: HealthLog; }

export default function MealCard({ log }: Props) {
    return (
        <Card>
            <Text style={styles.icon}>🍽️</Text>
            <Text style={styles.value}>{log.value} {log.unit}</Text>
            {log.note && <Text style={styles.note}>{log.note}</Text>}
        </Card>
    );
}

const styles = StyleSheet.create({
    icon: { fontSize: 28, marginBottom: 4 },
    value: { fontSize: 18, fontWeight: '700', color: '#11181C' },
    note: { fontSize: 13, color: '#9BA1A6', marginTop: 4 },
});

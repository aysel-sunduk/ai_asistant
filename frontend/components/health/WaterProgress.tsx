import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props { current: number; goal: number; unit?: string; }

export default function WaterProgress({ current, goal, unit = 'ml' }: Props) {
    const progress = Math.min(current / goal, 1);
    return (
        <View style={styles.container}>
            <Text style={styles.label}>💧 Su Takibi</Text>
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.text}>{current} / {goal} {unit}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    barBg: { height: 12, backgroundColor: '#E8F4FD', borderRadius: 6, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#4FC3F7', borderRadius: 6 },
    text: { fontSize: 14, color: '#9BA1A6', marginTop: 6, textAlign: 'right' },
});

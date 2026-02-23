// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Goal } from '../../src/models/goal.model';
import Card from '../ui/Card';

interface Props { goal: Goal; onPress?: () => void; }

export default function GoalCard({ goal, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <Text style={styles.title}>{goal.title}</Text>
                <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${goal.progressPct}%` }]} />
                </View>
                <Text style={styles.progress}>{goal.progressPct}%</Text>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 16, fontWeight: '600', color: '#11181C', marginBottom: 8 },
    barBg: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 4 },
    progress: { fontSize: 12, color: '#9BA1A6', marginTop: 4, textAlign: 'right' },
});
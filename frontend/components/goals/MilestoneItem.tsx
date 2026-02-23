// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { Milestone } from '../../src/models/goal.model';

interface Props { milestone: Milestone; onToggle?: () => void; }

export default function MilestoneItem({ milestone, onToggle }: Props) {
    return (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.container}>
            <Text style={styles.check}>{milestone.isCompleted ? '✅' : '⬜'}</Text>
            <Text style={[styles.title, milestone.isCompleted && styles.completed]}>{milestone.title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    check: { fontSize: 18 },
    title: { fontSize: 15, color: '#11181C', flex: 1 },
    completed: { textDecorationLine: 'line-through', color: '#9BA1A6' },
});
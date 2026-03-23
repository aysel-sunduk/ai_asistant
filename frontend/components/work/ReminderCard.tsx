// @ts-nocheck
// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Reminder } from '../../src/models/reminder.model';
import { formatDateTime } from '../../src/utils/format';
import Card from '../ui/Card';

interface Props { reminder: Reminder; onToggle?: () => void; }

export default function ReminderCard({ reminder, onToggle }: Props) {
    const isDone = reminder.status === 'sent' || reminder.status === 'skipped' || reminder.isCompleted;

    return (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
            <Card>
                <View style={styles.row}>
                    <Text style={styles.badge}>{isDone ? 'Tamam' : 'Planli'}</Text>
                    <View style={styles.info}>
                        <Text style={[styles.title, isDone && styles.completed]}>{reminder.title}</Text>
                        <Text style={styles.date}>{formatDateTime(reminder.remindAt || reminder.dateTime)}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badge: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5B8DEF',
        backgroundColor: '#EEF4FF',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    info: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    completed: { textDecorationLine: 'line-through', color: '#9BA1A6' },
    date: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
});
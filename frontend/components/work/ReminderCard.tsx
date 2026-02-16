import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Reminder } from '../../src/models/reminder.model';
import { formatDateTime } from '../../src/utils/format';
import Card from '../ui/Card';

interface Props { reminder: Reminder; onToggle?: () => void; }

export default function ReminderCard({ reminder, onToggle }: Props) {
    return (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
            <Card>
                <View style={styles.row}>
                    <Text style={styles.check}>{reminder.isCompleted ? '☑️' : '⬜'}</Text>
                    <View style={styles.info}>
                        <Text style={[styles.title, reminder.isCompleted && styles.completed]}>{reminder.title}</Text>
                        <Text style={styles.date}>{formatDateTime(reminder.dateTime)}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    check: { fontSize: 22 },
    info: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    completed: { textDecorationLine: 'line-through', color: '#9BA1A6' },
    date: { fontSize: 12, color: '#9BA1A6', marginTop: 2 },
});

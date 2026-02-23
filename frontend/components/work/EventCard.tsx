// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { WorkEvent } from '../../src/models/work.model';
import { formatDateTime } from '../../src/utils/format';
import Card from '../ui/Card';

interface Props { event: WorkEvent; onPress?: () => void; }

export default function EventCard({ event, onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.time}>{formatDateTime(event.startTime)}</Text>
                {event.location && <Text style={styles.location}>📍 {event.location}</Text>}
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    title: { fontSize: 16, fontWeight: '600', color: '#11181C' },
    time: { fontSize: 13, color: '#6C63FF', marginTop: 4 },
    location: { fontSize: 13, color: '#9BA1A6', marginTop: 4 },
});
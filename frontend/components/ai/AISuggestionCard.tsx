import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../ui/Card';

interface Props { suggestion: string; onAccept?: () => void; onDismiss?: () => void; }

export default function AISuggestionCard({ suggestion, onAccept, onDismiss }: Props) {
    return (
        <Card style={styles.card}>
            <Text style={styles.icon}>🤖</Text>
            <Text style={styles.text}>{suggestion}</Text>
            <View style={styles.actions}>
                {onAccept && (
                    <TouchableOpacity style={styles.accept} onPress={onAccept}>
                        <Text style={styles.acceptText}>Kabul Et</Text>
                    </TouchableOpacity>
                )}
                {onDismiss && (
                    <TouchableOpacity onPress={onDismiss}>
                        <Text style={styles.dismiss}>Kapat</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: { borderLeftWidth: 3, borderLeftColor: '#6C63FF' },
    icon: { fontSize: 24, marginBottom: 8 },
    text: { fontSize: 14, color: '#11181C', lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
    accept: { backgroundColor: '#6C63FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    acceptText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    dismiss: { color: '#9BA1A6', fontSize: 14, paddingVertical: 8 },
});

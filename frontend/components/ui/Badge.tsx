import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
    label: string;
    color?: string;
    textColor?: string;
}

export default function Badge({ label, color = '#6C63FF', textColor = '#fff' }: BadgeProps) {
    return (
        <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    text: { fontSize: 12, fontWeight: '600' },
});

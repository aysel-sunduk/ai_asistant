// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: string;
}

export default function EmptyState({ title, description, icon = '📭' }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    icon: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '600', color: '#11181C', textAlign: 'center' },
    description: { fontSize: 14, color: '#9BA1A6', textAlign: 'center', marginTop: 8 },
});
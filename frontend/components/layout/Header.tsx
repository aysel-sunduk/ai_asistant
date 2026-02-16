import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

interface HeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    style?: ViewStyle;
}

export default function Header({ title, onBack, rightAction, style }: HeaderProps) {
    return (
        <View style={[styles.container, style]}>
            {onBack ? (
                <TouchableOpacity onPress={onBack} style={styles.back}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {rightAction || <View style={styles.placeholder} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    back: { padding: 4 },
    backText: { fontSize: 24, color: '#11181C' },
    title: { fontSize: 18, fontWeight: '700', color: '#11181C', flex: 1, textAlign: 'center' },
    placeholder: { width: 32 },
});

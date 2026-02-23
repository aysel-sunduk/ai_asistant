// Kisa aciklama: Bu dosya UI bilesenini tanimlar.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, type ViewStyle } from 'react-native';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    visible: boolean;
    onHide: () => void;
    duration?: number;
    style?: ViewStyle;
}

const COLORS = {
    success: '#4ECDC4',
    error: '#FF6B6B',
    info: '#6C63FF',
};

export default function Toast({ message, type = 'info', visible, onHide, duration = 3000, style }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(duration),
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => onHide());
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { backgroundColor: COLORS[type], opacity }, style]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'absolute', top: 60, left: 16, right: 16, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, zIndex: 999 },
    text: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
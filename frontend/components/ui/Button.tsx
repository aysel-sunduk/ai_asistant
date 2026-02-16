import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type TextStyle, type ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export default function Button({ title, onPress, variant = 'primary', disabled, loading, style, textStyle }: ButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.base, styles[variant], disabled && styles.disabled, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? '#6C63FF' : '#fff'} />
            ) : (
                <Text style={[styles.text, variant === 'outline' && styles.outlineText, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    primary: { backgroundColor: '#6C63FF' },
    secondary: { backgroundColor: '#4ECDC4' },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#6C63FF' },
    danger: { backgroundColor: '#FF6B6B' },
    disabled: { opacity: 0.5 },
    text: { color: '#fff', fontSize: 16, fontWeight: '600' },
    outlineText: { color: '#6C63FF' },
});

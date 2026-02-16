import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

interface AvatarProps {
    uri?: string;
    name?: string;
    size?: number;
    style?: ViewStyle;
}

export default function Avatar({ uri, name, size = 40, style }: AvatarProps) {
    const initials = name
        ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    if (uri) {
        return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />;
    }

    return (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style]}>
            <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    placeholder: { backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' },
    initials: { color: '#fff', fontWeight: '700' },
});

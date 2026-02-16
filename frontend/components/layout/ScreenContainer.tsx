import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, type ViewStyle } from 'react-native';

interface ScreenContainerProps {
    children: React.ReactNode;
    scrollable?: boolean;
    style?: ViewStyle;
}

export default function ScreenContainer({ children, scrollable = true, style }: ScreenContainerProps) {
    return (
        <SafeAreaView style={[styles.safe, style]}>
            {scrollable ? (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {children}
                </ScrollView>
            ) : (
                children
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F8F9FA' },
    scroll: { padding: 16 },
});

import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../hooks/use-color-scheme';
import { resolveTheme, useThemeStore } from '../src/store/theme.store';

const PRIMARY = '#6C63FF';
const BG = '#F8F9FA';

export default function AboutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const mode = useThemeStore((s) => s.mode);
    const resolved = resolveTheme(mode, systemScheme);
    const isDark = resolved === 'dark';

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} backgroundColor={PRIMARY} />
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Hakkında</Text>
                <Text style={styles.subtitle}>BTK uzun dönem staj projesi</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.paragraph, isDark && styles.paragraphDark]}>
                    Bu uygulama BTK uzun dönem staj programı kapsamında geliştirilmiştir. Amaç, günlük yaşam
                    ve kariyer süreçlerini tek bir yerden yönetmeyi kolaylaştıran, modüler bir kişisel asistan sunmaktır.
                </Text>
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Genel Özellikler</Text>
                <Text style={[styles.paragraph, isDark && styles.paragraphDark]}>
                    AI destekli mülakat pratiği, toplantı ve mülakat takibi, hedef ve plan yönetimi, finans takibi,
                    sağlık ve alışkanlık modülleri, sosyal içerik ve bildirim akışları gibi alanları kapsar.
                </Text>
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Amaç</Text>
                <Text style={[styles.paragraph, isDark && styles.paragraphDark]}>
                    Kullanıcıların üretkenliklerini artırmalarına, hazırlık süreçlerini sistematik hale getirmelerine
                    ve farklı yaşam alanlarındaki verilerini tek panelde görmelerine yardımcı olmak hedeflenmiştir.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    containerDark: { backgroundColor: '#0B1220' },
    header: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    title: { fontSize: 22, fontWeight: '800', color: '#fff' },
    subtitle: { marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    content: { padding: 20, paddingBottom: 40 },
    sectionTitle: { marginTop: 16, fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
    sectionTitleDark: { color: '#E2E8F0' },
    paragraph: { marginTop: 10, fontSize: 14, color: '#334155', lineHeight: 22 },
    paragraphDark: { color: '#CBD5E1' },
});

// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { StyleSheet, Text, View } from 'react-native';
import { resolveTheme, useThemeStore } from '../../src/store/theme.store';
import { useColorScheme } from '../../hooks/use-color-scheme';
export default function CategoriesScreen() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    return (<View style={[styles.container, isDark && styles.containerDark]}><Text style={[styles.title, isDark && styles.textDark]}>Kategoriler</Text></View>);
}
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },

    /* ─── Dark Mode ─── */
    containerDark: { backgroundColor: '#0B1220' },
    cardDark: { backgroundColor: '#111827', borderColor: '#1F2937' },
    inputDark: { backgroundColor: '#1E293B', borderColor: '#374151', color: '#E5E7EB' },
    textDark: { color: '#E5E7EB' },
    subTextDark: { color: '#9CA3AF' },
});
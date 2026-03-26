// Kisa aciklama: Bu dosya ekran/route yapisini tanimlar.
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';
import { resolveTheme, useThemeStore } from '../src/store/theme.store';
import { useColorScheme } from '../hooks/use-color-scheme';

/**
 * Giriş noktası – kullanıcı durumuna göre yönlendirme.
 * Auth store'dan token kontrolü yapılarak (auth) veya (tabs) grubuna yönlendirilir.
 */
export default function Index() {
    const mode = useThemeStore((s) => s.mode);
    const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const isDark = resolveTheme(mode, systemScheme) === 'dark';

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(tabs)/dashboard" />;
    }

    return <Redirect href="/(auth)/login" />;
}
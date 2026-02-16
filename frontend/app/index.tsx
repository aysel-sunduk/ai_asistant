import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

/**
 * Giriş noktası – kullanıcı durumuna göre yönlendirme.
 * Auth store'dan token kontrolü yapılarak (auth) veya (tabs) grubuna yönlendirilir.
 */
export default function Index() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(tabs)/dashboard" />;
    }

    return <Redirect href="/(auth)/login" />;
}

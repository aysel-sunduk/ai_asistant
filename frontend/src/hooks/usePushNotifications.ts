// Kisa aciklama: Push notification izinleri alir ve token'i backend'e gonderir.
// NOT: expo-notifications ve expo-device native moduldur.
// Expo Go'da calismaz, development build gerektirir.
// Bu hook Expo Go'da sessizce atlar, uygulama cokmez.
import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '../api/user.api';

// Lazy import: native modul yoksa null doner
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants').default | null = null;

try {
    Notifications = require('expo-notifications');
} catch {
    console.warn('[PushNotifications] expo-notifications yuklenemedi (Expo Go?)');
}

try {
    Device = require('expo-device');
} catch {
    console.warn('[PushNotifications] expo-device yuklenemedi (Expo Go?)');
}

try {
    Constants = require('expo-constants').default;
} catch {
    console.warn('[PushNotifications] expo-constants yuklenemedi');
}

// Bildirim handler'i ayarla (sadece native modul varsa)
if (Notifications) {
    try {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    } catch {
        console.warn('[PushNotifications] Notification handler ayarlanamadi');
    }
}

export function usePushNotifications() {
    const router = useRouter();
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<any>(undefined);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        if (!Notifications) {
            console.log('[PushNotifications] Native modul yok, atlanıyor. Development build gerekli.');
            return;
        }

        // Push token al ve backend'e gonder
        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token);
                console.log('[PushNotifications] Token alindi:', token);

                userApi
                    .updatePushToken({
                        pushToken: token,
                        platform: Platform.OS,
                        deviceId: Device?.osBuildId ?? 'unknown',
                    })
                    .then(() => console.log('[PushNotifications] Token backend\'e gonderildi'))
                    .catch((err: any) =>
                        console.warn('[PushNotifications] Token gonderilemedi:', err?.message),
                    );
            }
        });

        // Bildirim dinleyicileri
        try {
            notificationListener.current = Notifications.addNotificationReceivedListener(
                (notif) => {
                    setNotification(notif);
                    console.log('[PushNotifications] Bildirim alindi:', notif.request.content.title);
                },
            );

            responseListener.current = Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const data = response.notification.request.content.data;
                    console.log('[PushNotifications] Bildirime tiklandi:', response.notification.request.content.title, data);
                    
                    if (data?.type === 'shopping_reminder' && data?.itemName) {
                        router.push({ 
                            pathname: '/(shopping)/lists', 
                            params: { addItem: String(data.itemName) } 
                        });
                    }
                },
            );
        } catch {
            console.warn('[PushNotifications] Listeners eklenemedi');
        }

        return () => {
            try {
                if (notificationListener.current) {
                    notificationListener.current.remove();
                }
                if (responseListener.current) {
                    responseListener.current.remove();
                }
            } catch {
                // sessizce atla
            }
        };
    }, []);

    return { expoPushToken, notification };
}

// ─── Yardimci: Izin iste ve Expo Push Token al ───────────────────
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (!Notifications) return undefined;

    try {
        // Android icin bildirim kanali olustur
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Varsayilan',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6C63FF',
            });
        }

        // Fiziksel cihaz kontrolu
        if (Device && !Device.isDevice) {
            console.warn('[PushNotifications] Fiziksel cihaz gerekli, simulator desteklenmiyor.');
            return undefined;
        }

        // Izin durumunu kontrol et
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('[PushNotifications] Bildirim izni verilmedi.');
            return undefined;
        }

        // Expo Push Token al
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            (Constants as any)?.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId as string,
        });

        return tokenData.data;
    } catch (error: any) {
        console.warn('[PushNotifications] Token alinamadi:', error?.message);
        return undefined;
    }
}

// ─── Test icin: Yerel bildirim gonder ────────────────────────────
export async function sendTestNotification() {
    if (!Notifications) {
        Alert.alert(
            'Bildirim Destegi Yok',
            'Push notification icin Development Build gerekli.\n\nKomut: npx expo run:ios veya npx expo run:android',
        );
        return;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Test Bildirimi 🚀',
                body: 'Push notification sisteminiz basariyla calisiyor!',
                data: { test: true },
            },
            trigger: null,
        });
    } catch (error: any) {
        Alert.alert('Hata', 'Bildirim gonderilemedi: ' + (error?.message || 'Bilinmeyen hata'));
    }
}

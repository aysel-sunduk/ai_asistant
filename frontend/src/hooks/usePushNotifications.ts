// Kisa aciklama: Push notification izinleri alir ve token'i backend'e gonderir.
// NOT: expo-notifications ve expo-device native moduldur.
// Expo Go'da calismaz, development build gerektirir.
// Bu hook Expo Go'da sessizce atlar, uygulama cokmez.
import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '../api/user.api';

import type * as ExpoNotifications from 'expo-notifications';
import type * as ExpoDevice from 'expo-device';

// Lazy import: native modul yoksa null doner
let Notifications: typeof ExpoNotifications | null = null;
let Device: typeof ExpoDevice | null = null;
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
                    
                    if (data?.screen) {
                        router.push({
                            pathname: data.screen as any,
                            params: (data.params as any) || {}
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

// ─── Bildirim izin durumunu kontrol et (Dışa aktarılmış) ──────────────────
export async function getNotificationPermissionStatus(): Promise<ExpoNotifications.PermissionStatus> {
    if (!Notifications) return 'undetermined' as any;
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status as ExpoNotifications.PermissionStatus;
    } catch {
        return 'undetermined' as any;
    }
}

// ─── Bildirim izni iste (reddedildiyse ayarlara yönlendir) ───────
export async function requestNotificationPermission(): Promise<boolean> {
    if (!Notifications) {
        Alert.alert(
            'Bildirim Desteği Yok',
            'Push notification için Development Build gereklidir.',
        );
        return false;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        if (existingStatus === 'granted') {
            return true;
        }

        // İlk kez soruluyorsa veya henüz belirlenmemişse
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status === 'granted') {
            // Token'ı al ve backend'e gönder
            await registerAndSendToken();
            return true;
        }

        // Kullanıcı daha önce reddetmişse, sistem ayarlarına yönlendir
        Alert.alert(
            'Bildirim İzni Gerekli',
            'Bildirimleri açmak için uygulama ayarlarından izin vermeniz gerekiyor.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Ayarlara Git',
                    onPress: () => {
                        const Linking = require('expo-linking');
                        Linking.openSettings();
                    },
                },
            ],
        );
        return false;
    } catch (error: any) {
        console.warn('[PushNotifications] İzin isteği hatası:', error?.message);
        return false;
    }
}

// ─── Token al ve backend'e gönder ────────────────────────────────
export async function registerAndSendToken() {
    if (!Notifications) {
        console.warn('[PushNotifications] Notifications modul yok.');
        return;
    }
    try {
        console.log('[PushNotifications] Token alinmaya calisiliyor...');
        const token = await registerForPushNotificationsAsync();
        
        if (!token) {
            console.warn('[PushNotifications] Token alinamadi, backend\'e gonderilemiyor.');
            return;
        }

        console.log('[PushNotifications] Token alindi, backend\'e gonderiliyor:', token);

        const { userApi } = require('../api/user.api');
        await userApi.updatePushToken({
            pushToken: token,
            platform: Platform.OS,
            deviceId: Device?.osBuildId ?? 'unknown',
        });
        
        console.log('[PushNotifications] Token backend\'e basariyla gonderildi (izin sonrasi)');
        Alert.alert('Basarili', 'Bildirim token\'i kaydedildi!');
    } catch (err: any) {
        console.warn('[PushNotifications] Token gonderme hatasi:', err?.message);
        Alert.alert('Hata', 'Bildirim token\'i gonderilemedi: ' + err?.message);
    }
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
            // Simulator ise uyari ver
            Alert.alert('Simülatör Uyarısı', 'Push bildirimleri sadece fiziksel cihazlarda çalışır.');
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
            Alert.alert('İzin Reddedildi', 'Bildirimlere izin vermediğiniz için bildirim alamazsınız.');
            return undefined;
        }

        // Expo Push Token al
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            (Constants as any)?.easConfig?.projectId;

        if (!projectId) {
            console.warn('[PushNotifications] Project ID bulunamadi! app.json kontrol edin.');
            Alert.alert('Yapılandırma Hatası', 'Project ID bulunamadı.');
            return undefined;
        }

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: projectId as string,
            });
            return tokenData.data;
        } catch (tokenErr: any) {
            console.warn('[PushNotifications] Expo token alinamadi:', tokenErr?.message);
            Alert.alert('Expo Hatası', 'Push token alınamadı: ' + tokenErr.message);
            return undefined;
        }
    } catch (error: any) {
        console.warn('[PushNotifications] Genel hata:', error?.message);
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

// Kisa aciklama: Push notification izinleri alir ve token'i backend'e gonderir.
// NOT: expo-notifications ve expo-device native moduldur.
// Expo Go'da calismaz, development build gerektirir.
// Bu hook Expo Go'da sessizce atlar, uygulama cokmez.
import { useState, useEffect, useRef } from 'react';
import { Platform, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { userApi } from '../api/user.api';

import type * as ExpoNotifications from 'expo-notifications';
import type * as ExpoDevice from 'expo-device';

// Lazy import: native modul yoksa null doner
let Notifications: typeof ExpoNotifications | null = null;
let Device: typeof ExpoDevice | null = null;

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
            console.log('[PushNotifications] Native modul yok, atlanÄ±yor. Development build gerekli.');
            return;
        }

        // Uygulama acilisinda izin popup'i gostermeden, yalnizca izin zaten varsa token guncelle.
        registerIfPermissionGranted().then((token) => {
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
                    const data = (notif.request.content.data || {}) as Record<string, any>;
                    const isLocalEcho = data.__localEcho === '1';

                    // Android'de app foreground'dayken ustten bildirim her zaman cikmayabilir.
                    // Bu durumda local echo ile sistem banner'i garantiye aliyoruz.
                    if (AppState.currentState === 'active' && !isLocalEcho) {
                        void Notifications.scheduleNotificationAsync({
                            content: {
                                title: notif.request.content.title || 'Yeni Bildirim',
                                body: notif.request.content.body || '',
                                data: { ...data, __localEcho: '1' },
                            },
                            trigger: null,
                        });
                    }

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

// â”€â”€â”€ Bildirim izin durumunu kontrol et (DÄ±ÅŸa aktarÄ±lmÄ±ÅŸ) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getNotificationPermissionStatus(): Promise<ExpoNotifications.PermissionStatus> {
    if (!Notifications) return 'undetermined' as any;
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status as ExpoNotifications.PermissionStatus;
    } catch {
        return 'undetermined' as any;
    }
}

// â”€â”€â”€ Bildirim izni iste (reddedildiyse ayarlara yÃ¶nlendir) â”€â”€â”€â”€â”€â”€â”€
export async function requestNotificationPermission(): Promise<boolean> {
    if (!Notifications) {
        Alert.alert(
            'Bildirim DesteÄŸi Yok',
            'Push notification iÃ§in Development Build gereklidir.',
        );
        return false;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        if (existingStatus === 'granted') {
            // Izin acik olsa bile token alinmadigi surece push aktif sayilmaz.
            return await registerAndSendToken();
        }

        // Ä°lk kez soruluyorsa veya henÃ¼z belirlenmemiÅŸse
        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status === 'granted') {
            // Token'Ä± al ve backend'e gÃ¶nder
            return await registerAndSendToken();
        }

        // KullanÄ±cÄ± daha Ã¶nce reddetmiÅŸse, sistem ayarlarÄ±na yÃ¶nlendir
        Alert.alert(
            'Bildirim Ä°zni Gerekli',
            'Bildirimleri aÃ§mak iÃ§in uygulama ayarlarÄ±ndan izin vermeniz gerekiyor.',
            [
                { text: 'Ä°ptal', style: 'cancel' },
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
        console.warn('[PushNotifications] Ä°zin isteÄŸi hatasÄ±:', error?.message);
        return false;
    }
}

// â”€â”€â”€ Token al ve backend'e gÃ¶nder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function registerAndSendToken(): Promise<boolean> {
    if (!Notifications) {
        console.warn('[PushNotifications] Notifications modul yok.');
        return false;
    }
    try {
        console.log('[PushNotifications] Token alinmaya calisiliyor...');
        const token = await registerForPushNotificationsAsync();
        
        if (!token) {
            console.warn('[PushNotifications] Token alinamadi, backend\'e gonderilemiyor.');
            return false;
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
        return true;
    } catch (err: any) {
        console.warn('[PushNotifications] Token gonderme hatasi:', err?.message);
        Alert.alert('Hata', 'Bildirim token\'i gonderilemedi: ' + err?.message);
        return false;
    }
}

// â”€â”€â”€ Yardimci: Izin iste ve Expo Push Token al â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            Alert.alert('Ä°zin Reddedildi', 'Bildirimlere izin vermediÄŸiniz iÃ§in bildirim alamazsÄ±nÄ±z.');
            return undefined;
        }

        try {
            // FCM iÃ§in Native Device Token alÄ±yoruz (DoÄŸrudan Google/FCM Ã¼zerinden)
            const tokenData = await Notifications.getDevicePushTokenAsync();
            console.log('[PushNotifications] Device Token (FCM):', tokenData.data);
            return tokenData.data;
        } catch (tokenErr: any) {
            console.warn('[PushNotifications] Device token alinamadi:', tokenErr?.message);
            Alert.alert('FCM HatasÄ±', 'Bildirim token\'Ä± alÄ±namadÄ±: ' + tokenErr.message);
            return undefined;
        }
    } catch (error: any) {
        console.warn('[PushNotifications] Genel hata:', error?.message);
        return undefined;
    }
}

async function registerIfPermissionGranted(): Promise<string | undefined> {
    if (!Notifications) return undefined;
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            return undefined;
        }
        return registerForPushNotificationsAsync();
    } catch (error: any) {
        console.warn('[PushNotifications] Permission check failed:', error?.message);
        return undefined;
    }
}

// â”€â”€â”€ Test icin: Yerel bildirim gonder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                title: 'Test Bildirimi ğŸš€',
                body: 'Push notification sisteminiz basariyla calisiyor!',
                data: { test: true },
            },
            trigger: null,
        });
    } catch (error: any) {
        Alert.alert('Hata', 'Bildirim gonderilemedi: ' + (error?.message || 'Bilinmeyen hata'));
    }
}


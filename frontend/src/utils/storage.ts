// Kisa aciklama: Destekleyici modul kodu icerir.
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';

/**
 * Storage helper – AsyncStorage veya SecureStore ile veri saklama
 */
export const storage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key);
        } catch {
            return null;
        }
    },

    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch {
            console.error(`Storage setItem hatası: ${key}`);
        }
    },

    removeItem: async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch {
            console.error(`Storage removeItem hatası: ${key}`);
        }
    },

    clear: async (): Promise<void> => {
        try {
            await AsyncStorage.clear();
        } catch {
            console.error('Storage clear hatası');
        }
    },
};
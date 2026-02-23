// Kisa aciklama: Destekleyici modul kodu icerir.
// i18n konfigürasyonu
// TODO: i18next veya expo-localization ile tam entegrasyon

import en from './en.json';
import tr from './tr.json';

type Language = 'tr' | 'en';

const translations: Record<Language, Record<string, string>> = { tr, en };

let currentLanguage: Language = 'tr';

export function setLanguage(lang: Language) {
    currentLanguage = lang;
}

export function getLanguage(): Language {
    return currentLanguage;
}

export function t(key: string): string {
    return translations[currentLanguage]?.[key] || key;
}

export default { t, setLanguage, getLanguage };
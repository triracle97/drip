import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import es from './locales/es';
import vi from './locales/vi';

export const SUPPORTED_LANGUAGES = ['en', 'zh', 'ja', 'ko', 'es', 'vi'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_OPTIONS: { code: 'auto' | SupportedLanguage; label: string }[] = [
  { code: 'auto', label: 'Auto (System)' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'Español' },
  { code: 'vi', label: 'Tiếng Việt' },
];

export function getDeviceLanguage(): SupportedLanguage {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode ?? 'en';
  if (SUPPORTED_LANGUAGES.includes(deviceLang as SupportedLanguage)) {
    return deviceLang as SupportedLanguage;
  }
  return 'en';
}

export function resolveLanguage(setting: string): SupportedLanguage {
  if (setting === 'auto') return getDeviceLanguage();
  if (SUPPORTED_LANGUAGES.includes(setting as SupportedLanguage)) {
    return setting as SupportedLanguage;
  }
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },
    ko: { translation: ko },
    es: { translation: es },
    vi: { translation: vi },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;

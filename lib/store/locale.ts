import { create } from 'zustand';

export type Locale = 'ja' | 'en' | 'zh' | 'ko' | 'fr' | 'de' | 'es' | 'pt' | 'ar' | 'ru' | 'hi';

export const SUPPORTED_LOCALES: Locale[] = ['ja', 'en', 'zh', 'ko', 'fr', 'de', 'es', 'pt', 'ar', 'ru', 'hi'];

export const LOCALE_NAMES: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  ru: 'Русский',
  hi: 'हिन्दी',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  ja: '🇯🇵',
  en: '🇺🇸',
  zh: '🇨🇳',
  ko: '🇰🇷',
  fr: '🇫🇷',
  de: '🇩🇪',
  es: '🇪🇸',
  pt: '🇧🇷',
  ar: '🇸🇦',
  ru: '🇷🇺',
  hi: '🇮🇳',
};

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'ja',
  setLocale: (locale) => {
    set({ locale });
    if (typeof window !== 'undefined') {
      localStorage.setItem('pv-locale', locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  },
}));

// Initialize from localStorage on client
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('pv-locale') as Locale | null;
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    useLocaleStore.getState().setLocale(saved);
  }
}

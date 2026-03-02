import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationZH from './locales/zh-TW/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  'zh-TW': {
    translation: translationZH,
  },
  'zh': {
    translation: translationZH,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-TW',
    lng: localStorage.getItem('i18nextLng') || undefined, // 優先嘗試從本地讀取
    supportedLngs: ['zh-TW', 'zh', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

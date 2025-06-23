import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from '../../src/locales/en/translation.json';
import translationSI from '../../src/locales/si/translation.json';
import translationTA from '../../src/locales/ta/translation.json';

const resources = {
  en: { translation: translationEN },
  si: { translation: translationSI },
  ta: { translation: translationTA },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

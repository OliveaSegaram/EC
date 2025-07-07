import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import siTranslation from './locales/si/translation.json';
import taTranslation from './locales/ta/translation.json';

// Define resources type with flat structure
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: {
        // Common
        [key: string]: string;
      };
    };
  }
}

// Clear any cached language settings
if (typeof window !== 'undefined') {
  localStorage.removeItem('i18nextLng');
}

const resources = {
  en: {
    translation: enTranslation
  },
  si: {
    translation: siTranslation
  },
  ta: {
    translation: taTranslation
  }
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en', 'si', 'ta'],
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
    },
  });

// Enhanced debug logging
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  console.log('Available languages:', i18n.languages);
  console.log('Current language in i18n:', i18n.language);
  document.documentElement.setAttribute('lang', lng);
  
  // Verify the language was actually changed
  setTimeout(() => {
    console.log('Current language after change:', i18n.language);
    console.log('HTML lang attribute:', document.documentElement.getAttribute('lang'));
  }, 100);
});

export default i18n;

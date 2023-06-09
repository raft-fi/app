import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LngDetector from 'i18next-browser-languagedetector';
import resources from './translations';
import { SUPPORTED_LOCALES, SupportedLocale } from './i18nTypes';

i18n
  .use(initReactI18next)
  .use(LngDetector)
  .init({
    resources,
    fallbackLng: SUPPORTED_LOCALES[0],
    supportedLngs: SUPPORTED_LOCALES,
    load: 'currentOnly',
    returnEmptyString: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'raft-app-locale',
      caches: ['localStorage'],
    },

    react: {
      useSuspense: false,
    },
  });

export type { SupportedLocale };
export { SUPPORTED_LOCALES };
export default i18n;

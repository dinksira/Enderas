/**
 * i18next initialization — wires English and Amharic resource bundles.
 *
 * Language persistence
 * --------------------
 * The runtime language is owned by `appStore` (Zustand + persist), which
 * calls `i18n.changeLanguage()` whenever the user changes language. On
 * cold boot, `app/_layout.tsx` waits for the persisted store to hydrate
 * and then syncs i18n to the persisted language.
 *
 * Configuration notes
 * -------------------
 * - `compatibilityJSON: 'v4'` keeps the v4 plural resolver that both
 *   locale files were authored against. Upgrading to v5 would require
 *   re-encoding plurals as `_one` / `_other` keys, which is out of scope.
 * - `fallbackLng: 'en'` ensures missing Amharic keys fall back to
 *   English rather than rendering the raw key.
 * - `interpolation.escapeValue: false` — React already escapes text, so
 *   letting i18next escape would double-encode ampersands.
 * - `returnNull: false` — i18next v23+ returns the literal `"null"` for
 *   missing keys unless this is set; we want empty-string behavior.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import am from '@/locales/am.json';

export const SUPPORTED_LANGUAGES = ['en', 'am'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  am: 'አማርኛ',
};

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

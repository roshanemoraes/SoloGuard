import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './languages/en.json';
import ta from './languages/ta.json';
import si from './languages/si.json';

// Define available translations
export const translations = { en, ta, si };

// ✅ Create a new I18n instance
const i18n = new I18n(translations);

// Configure fallbacks and default locale
i18n.enableFallback = true; // instead of `fallbacks`
i18n.defaultLocale = 'en';

// Detect device language
const deviceLanguage = Localization.locale.split('-')[0];
i18n.locale = deviceLanguage in translations ? deviceLanguage : 'en';

// Helper to switch language
export const setAppLanguage = (lang: keyof typeof translations) => {
  i18n.locale = lang;
};

// Helper to get current language
export const getAppLanguage = (): keyof typeof translations => {
  return i18n.locale as keyof typeof translations;
};

export default i18n;

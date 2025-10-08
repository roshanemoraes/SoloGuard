import en from '../i18n/languages/en.json';

declare module 'i18n-js' {
  type DefaultTranslations = typeof en;

  // Extend i18n-js definitions
  interface I18n {
    t<K extends keyof DefaultTranslations>(
      scope: K,
      options?: Record<string, any>
    ): DefaultTranslations[K];
  }
}

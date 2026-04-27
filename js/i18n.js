import { Keys, Storage, FALLBACK_TRANSLATIONS } from './core.js';

export const I18n = {
  translations: FALLBACK_TRANSLATIONS,
  lang: 'de',

  get locale() {
    const localeMap = { de: 'de-DE', en: 'en-GB' };
    return localeMap[this.lang] || this.lang;
  },

  async init(remoteTranslations = null) {
    this.lang = Storage.get(Keys.language, 'de');
    if (remoteTranslations) {
      this.translations = remoteTranslations;
    }
    this.applyToDOM();
  },

  t(key, fallback = null) {
    return this.translations?.[this.lang]?.[key] ?? fallback ?? key;
  },

  setLanguage(l) {
    this.lang = l;
    Storage.set(Keys.language, l);
    this.applyToDOM();
    document.documentElement.lang = l;
  },

  applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAriaLabel));
    });
  }
};

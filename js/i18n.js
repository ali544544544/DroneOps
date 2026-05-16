import { Keys, Storage, FALLBACK_TRANSLATIONS } from './core.js';

export const I18n = {
  translations: FALLBACK_TRANSLATIONS,
  defaultLang: 'de',
  lang: 'de',

  get locale() {
    const localeMap = { de: 'de-DE', en: 'en-GB' };
    return localeMap[this.lang] || this.lang;
  },

  async init(remoteTranslations = null) {
    this.loadStoredLanguage();
    if (remoteTranslations) {
      this.translations = remoteTranslations;
    }
    this.applyToDOM();
  },

  normalizeLanguage(value) {
    return ['de', 'en'].includes(value) ? value : this.defaultLang;
  },

  loadStoredLanguage() {
    this.lang = this.normalizeLanguage(Storage.get(Keys.language, this.defaultLang));
    document.documentElement.lang = this.lang;
    return this.lang;
  },

  t(key, fallback = null) {
    return this.translations?.[this.lang]?.[key] ?? fallback ?? key;
  },

  setLanguage(l) {
    this.lang = this.normalizeLanguage(l);
    Storage.set(Keys.language, this.lang);
    this.applyToDOM();
    document.documentElement.lang = this.lang;
  },

  applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const text = this.t(el.dataset.i18nTitle);
      if (el.classList.contains('info-dot')) {
        el.dataset.tooltip = text;
        el.setAttribute('aria-label', text);
        el.removeAttribute('title');
      } else {
        el.title = text;
      }
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAriaLabel));
    });
  }
};

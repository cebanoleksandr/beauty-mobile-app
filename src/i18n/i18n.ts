/**
 * App i18n — same stack and rules as the web app (core/i18n/i18n.ts):
 * i18next + ICU messages, languages uk / en / ru, Ukrainian by default.
 *
 * The web app takes the language from Telegram's initData; a native app has
 * none, so the device language is used (overridable in Settings → Language).
 * Catalog names (JSONB) follow the same language via `useTranslate`.
 */
import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

export const SUPPORTED_LANGS = ['uk', 'en', 'ru'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: SupportedLang = 'uk';

export function isSupportedLang(v: string | undefined | null): v is SupportedLang {
  return v === 'uk' || v === 'en' || v === 'ru';
}

/** Device locale → supported language (`uk-UA` → `uk`), else the default. */
export function deviceLanguage(): SupportedLang {
  let locale: string | undefined;
  try {
    locale = Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    locale = undefined;
  }
  const lang = locale?.slice(0, 2).toLowerCase();
  return isSupportedLang(lang) ? lang : DEFAULT_LANG;
}

if (!i18n.isInitialized) {
  i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: deviceLanguage(),
      fallbackLng: DEFAULT_LANG,
      supportedLngs: SUPPORTED_LANGS,
      ns: ['common'],
      defaultNS: 'common',
      resources: { uk: { common: uk }, en: { common: en }, ru: { common: ru } },
      interpolation: { escapeValue: false },
      initAsync: false,
      react: { useSuspense: false },
    });
}

export { i18n };

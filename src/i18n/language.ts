import { useCallback } from 'react';
import type { Translations } from '../api/types';
import { pickTranslation } from './pickTranslation';

/**
 * Single switch point for the UI language. The app copy is English for now
 * (as in the designs); when i18n lands, derive this from the user's
 * Telegram `language_code` / device locale instead.
 */
export const APP_LANGUAGE = 'en';

export function useLanguage(): string {
  return APP_LANGUAGE;
}

/** `const tr = useTranslate(); tr(master.category)` — resolves JSONB catalog names. */
export function useTranslate() {
  const lang = useLanguage();
  return useCallback((value: Translations | null | undefined) => pickTranslation(value, lang), [lang]);
}

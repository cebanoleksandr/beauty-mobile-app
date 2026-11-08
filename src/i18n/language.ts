import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Translations } from '../api/types';
import { i18n } from './i18n';
import { pickTranslation } from './pickTranslation';

/** Current UI language (re-renders on change). */
export function useLanguage(): string {
  return useTranslation().i18n.language ?? i18n.language;
}

/** `const tr = useTranslate(); tr(master.category)` — resolves JSONB catalog names in the UI language. */
export function useTranslate() {
  const lang = useLanguage();
  return useCallback((value: Translations | null | undefined) => pickTranslation(value, lang), [lang]);
}

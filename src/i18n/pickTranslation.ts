import type { Translations } from '../api/types';

export const DEFAULT_LANG = 'uk';

/**
 * Picks the active language from a JSONB catalog name, falling back to `uk`,
 * then whatever is present (same rules as the web app's pickTranslation).
 */
export function pickTranslation(value: Translations | null | undefined, lang: string): string {
  if (!value) return '';
  return value[lang] ?? value[DEFAULT_LANG] ?? Object.values(value)[0] ?? '';
}

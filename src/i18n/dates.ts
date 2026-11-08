/**
 * Locale-aware date pieces (Intl, current UI language). Use these instead of
 * hard-coded month / weekday names. Times stay 24h `HH:mm` everywhere.
 */
import { i18n } from './i18n';

const cache = new Map<string, Intl.DateTimeFormat>();

function fmt(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const lang = i18n.language || 'uk';
  const key = lang + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(lang, options);
    cache.set(key, f);
  }
  return f;
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase(i18n.language) + s.slice(1);
const clean = (s: string) => s.replace(/\.$/, '');

/** `Mon` / `Пн` */
export const weekdayShort = (d: Date) => capitalize(clean(fmt({ weekday: 'short' }).format(d)));
/** `Monday` / `Понеділок` */
export const weekdayLong = (d: Date) => capitalize(fmt({ weekday: 'long' }).format(d));
/** `Nov` / `лист.` → `Лист` */
export const monthShort = (d: Date) => capitalize(clean(fmt({ month: 'short' }).format(d)));
/** `November 2026` / `Листопад 2026` (standalone month) */
export const monthYear = (d: Date) => capitalize(fmt({ month: 'long', year: 'numeric' }).format(d));
/** `Nov 8` / `8 лист.` */
export const dayMonthShort = (d: Date) => fmt({ day: 'numeric', month: 'short' }).format(d);
/** `November 8` / `8 листопада` */
export const dayMonthLong = (d: Date) => fmt({ day: 'numeric', month: 'long' }).format(d);
/** `Sat, Nov 8` / `сб, 8 лист.` */
export const weekdayDayMonth = (d: Date) => fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(d);
/** `08.11.26` */
export const shortNumericDate = (d: Date) => fmt({ day: '2-digit', month: '2-digit', year: '2-digit' }).format(d);

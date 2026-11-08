/** Formatting helpers for admin screens (timestamps are ISO instants), localized. */
import { i18n } from '../../i18n';
import { dayMonthShort } from '../../i18n/dates';

const pad = (n: number) => String(n).padStart(2, '0');

/** `just now`, `5 min ago`, `3 h ago`, `2 d ago`, `Nov 8`. */
export function relativeTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const minutes = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (Number.isNaN(minutes)) return '';
  if (minutes < 1) return i18n.t('admin.time.justNow');
  if (minutes < 60) return i18n.t('admin.time.minAgo', { count: minutes });
  if (minutes < 24 * 60) return i18n.t('admin.time.hAgo', { count: Math.round(minutes / 60) });
  if (minutes < 7 * 24 * 60) return i18n.t('admin.time.dAgo', { count: Math.round(minutes / 1440) });
  return dayMonthShort(d);
}

/** `Nov 8, 14:05`. */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  return `${dayMonthShort(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `Nov 8` for a `YYYY-MM-DD` (UTC day). */
export function utcDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return dayMonthShort(new Date(y, m - 1, d));
}

/** Whole percent, or null when there's nothing to divide by. */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

/** `< 1 min`, `42 min`, `3.5 h`. */
export function formatMinutes(minutes: number): string {
  if (minutes < 1) return i18n.t('admin.time.lessThanMinute');
  if (minutes < 60) return i18n.t('units.minutes', { value: Math.round(minutes) });
  return i18n.t('units.hours', { value: Math.round(minutes / 6) / 10 });
}

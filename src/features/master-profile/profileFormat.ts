import type { AvailabilityDayDto, MasterServiceDto } from '../../api';
import { i18n } from '../../i18n';
import { weekdayDayMonth } from '../../i18n/dates';

/** Local `YYYY-MM-DD` for a Date (slot dates from the backend are local too). */
function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `Today` / `Tomorrow` / `Mon, Nov 12` (localized) for a `YYYY-MM-DD` date. */
export function formatDayLabel(date: string, now = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date === isoDay(now)) return i18n.t('dates.today');
  if (date === isoDay(tomorrow)) return i18n.t('dates.tomorrow');
  const [y, m, d] = date.split('-').map(Number);
  return weekdayDayMonth(new Date(y, m - 1, d));
}

/** First bookable slot: `Today, 16:30`, or null when the master has none open. */
export function nextSlotLabel(days: readonly AvailabilityDayDto[] | undefined, now = new Date()): string | null {
  for (const day of days ?? []) {
    const slot = day.slots.find(s => s.available);
    if (slot) return i18n.t('dates.dayTime', { day: formatDayLabel(day.date, now), time: slot.time });
  }
  return null;
}

/** `3 days ago`, `Today`, `2 months ago` for a `YYYY-MM-DD` date. */
export function formatRelativeDate(date: string, now = new Date()): string {
  const [y, m, d] = date.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return i18n.t('dates.today');
  if (days === 1) return i18n.t('dates.yesterday');
  if (days < 7) return i18n.t('dates.daysAgo', { count: days });
  if (days < 30) return i18n.t('dates.weeksAgo', { count: Math.floor(days / 7) });
  if (days < 365) return i18n.t('dates.monthsAgo', { count: Math.floor(days / 30) });
  return i18n.t('dates.yearsAgo', { count: Math.floor(days / 365) });
}

/** `45 min`, `1 h`, `1 h 30 min` (localized). */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return i18n.t('units.minutes', { value: minutes });
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? i18n.t('units.hoursMinutes', { hours: h, minutes: rest }) : i18n.t('units.hours', { value: h });
}

/** Initials for a review author avatar (`Camilla P.` → `CP`). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join('');
}

export function minPrice(services: readonly MasterServiceDto[]): number | null {
  return services.length ? Math.min(...services.map(s => s.price)) : null;
}

/** Formatting helpers for admin screens (timestamps are ISO instants). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** `just now`, `5 min ago`, `3 h ago`, `2 d ago`, `Nov 8`. */
export function relativeTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const minutes = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (Number.isNaN(minutes)) return '';
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  if (minutes < 7 * 24 * 60) return `${Math.round(minutes / 1440)} d ago`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** `Nov 8, 14:05`. */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `Nov 8` for a `YYYY-MM-DD` (UTC day). */
export function utcDay(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** Whole percent, or null when there's nothing to divide by. */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

/** `< 1 min`, `42 min`, `3.5 h`. */
export function formatMinutes(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${Math.round(minutes / 6) / 10} h`;
}

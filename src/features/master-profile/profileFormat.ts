import type { AvailabilityDayDto, MasterServiceDto } from '../../api';

/** Local `YYYY-MM-DD` for a Date (slot dates from the backend are local too). */
function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Today` / `Tomorrow` / `Mon 12 Nov` for a `YYYY-MM-DD` date. */
export function formatDayLabel(date: string, now = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date === isoDay(now)) return 'Today';
  if (date === isoDay(tomorrow)) return 'Tomorrow';
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return `${WEEKDAYS[day.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

/** First bookable slot: `Today, 16:30`, or null when the master has none open. */
export function nextSlotLabel(days: readonly AvailabilityDayDto[] | undefined, now = new Date()): string | null {
  for (const day of days ?? []) {
    const slot = day.slots.find(s => s.available);
    if (slot) return `${formatDayLabel(day.date, now)}, ${slot.time}`;
  }
  return null;
}

/** `3 days ago`, `Today`, `2 months ago` for a `YYYY-MM-DD` date. */
export function formatRelativeDate(date: string, now = new Date()): string {
  const [y, m, d] = date.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w === 1 ? '' : 's'} ago`;
  }
  if (days < 365) {
    const mo = Math.floor(days / 30);
    return `${mo} month${mo === 1 ? '' : 's'} ago`;
  }
  const yr = Math.floor(days / 365);
  return `${yr} year${yr === 1 ? '' : 's'} ago`;
}

/** `150 min`, `1 h`, `1 h 30 min`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
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

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

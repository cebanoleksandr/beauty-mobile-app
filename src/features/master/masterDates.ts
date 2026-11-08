/** Date helpers for the master workspace. Booking/slot times are local `YYYY-MM-DDTHH:mm[:ss]`. */
import type { BookingDetailResponse } from '../../api';
import { startOf } from '../bookings/bookingGroups';

const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Local calendar date key `YYYY-MM-DD` (not UTC — `toISOString` flips the day after midnight). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export const weekdayShort = (d: Date) => WEEKDAYS[d.getDay()];
export const monthShort = (d: Date) => MONTHS[d.getMonth()];

/** `Today, Nov 8` / `Tomorrow, Nov 9` / `Monday, Nov 10`. */
export function dayHeader(key: string, now = new Date()): string {
  const d = parseDayKey(key);
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  if (key === dayKey(now)) return `Today, ${base}`;
  if (key === dayKey(addDays(now, 1))) return `Tomorrow, ${base}`;
  if (key === dayKey(addDays(now, -1))) return `Yesterday, ${base}`;
  return `${WEEKDAYS_LONG[d.getDay()]}, ${base}`;
}

/** `HH:mm` of a local date-time string. */
export function timeOf(localDateTime: string): string {
  return localDateTime.split('T')[1]?.slice(0, 5) ?? '';
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function hhmm(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** `10:00 – 11:30`. */
export function timeRange(b: Pick<BookingDetailResponse, 'scheduledTime' | 'durationMinutes'>): string {
  const start = minutesOf(timeOf(b.scheduledTime));
  return `${hhmm(start)} – ${hhmm(start + b.durationMinutes)}`;
}

/** `08.11.26`. */
export function shortDate(localDateTime: string): string {
  const d = startOf({ scheduledTime: localDateTime } as BookingDetailResponse);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

/** Groups by local day; `desc` = newest day first. */
export function groupByDay<T>(items: readonly T[], timeOfItem: (item: T) => string, desc = false): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = timeOfItem(item).slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  for (const list of map.values()) list.sort((a, b) => timeOfItem(a).localeCompare(timeOfItem(b)));
  return [...map.entries()].sort(([a], [b]) => (desc ? b.localeCompare(a) : a.localeCompare(b)));
}

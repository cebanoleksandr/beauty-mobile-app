/**
 * Splits the client's bookings (`GET /api/bookings?scope=as-client`) into the
 * Upcoming / Past / Cancelled tabs and maps backend statuses to labels.
 *
 * PENDING → waiting for the master; SCHEDULED → confirmed (holds the slot);
 * COMPLETED / MISSED → past; CANCELED / REJECTED → cancelled. A PENDING or
 * SCHEDULED booking whose time has passed counts as past even before the
 * backend's 15-minute sweep resolves it.
 */
import type { BookingDetailResponse, BookingStatus } from '../../api';

export type BookingTab = 'upcoming' | 'past' | 'cancelled';

const pad = (n: number) => String(n).padStart(2, '0');

/** `scheduledTime` is a local `YYYY-MM-DDTHH:mm[:ss]` (business time, no zone). */
export function startOf(b: BookingDetailResponse): Date {
  const [date, time] = b.scheduledTime.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

export function endOf(b: BookingDetailResponse): Date {
  return new Date(startOf(b).getTime() + b.durationMinutes * 60_000);
}

export function tabOf(b: BookingDetailResponse, now = new Date()): BookingTab {
  switch (b.status) {
    case 'CANCELED':
    case 'REJECTED':
      return 'cancelled';
    case 'COMPLETED':
    case 'MISSED':
      return 'past';
    default:
      return endOf(b) < now ? 'past' : 'upcoming';
  }
}

export function groupBookings(list: readonly BookingDetailResponse[], now = new Date()) {
  const groups: Record<BookingTab, BookingDetailResponse[]> = { upcoming: [], past: [], cancelled: [] };
  for (const b of list) groups[tabOf(b, now)].push(b);
  groups.upcoming.sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
  groups.past.sort((a, b) => startOf(b).getTime() - startOf(a).getTime());
  groups.cancelled.sort((a, b) => startOf(b).getTime() - startOf(a).getTime());
  return groups;
}

/** Client may cancel while it's still ahead (backend allows PENDING/SCHEDULED). */
export function canCancel(b: BookingDetailResponse, now = new Date()): boolean {
  return (b.status === 'PENDING' || b.status === 'SCHEDULED') && startOf(b) > now;
}

export type StatusTone = 'success' | 'pending' | 'muted' | 'danger';

export function statusInfo(
  status: BookingStatus,
  perspective: 'client' | 'master' = 'client',
): { label: string; tone: StatusTone } {
  if (perspective === 'master') {
    if (status === 'PENDING') return { label: 'New request', tone: 'pending' };
    if (status === 'REJECTED') return { label: 'Declined', tone: 'muted' };
    if (status === 'MISSED') return { label: 'No-show', tone: 'danger' };
  }
  switch (status) {
    case 'SCHEDULED':
      return { label: 'Confirmed', tone: 'success' };
    case 'PENDING':
      return { label: 'Awaiting confirmation', tone: 'pending' };
    case 'COMPLETED':
      return { label: 'Completed', tone: 'success' };
    case 'MISSED':
      return { label: 'Missed', tone: 'danger' };
    case 'REJECTED':
      return { label: 'Declined by master', tone: 'danger' };
    case 'CANCELED':
      return { label: 'Cancelled', tone: 'muted' };
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dayDiff(date: Date, now: Date): number {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** Badge next to "Next appointment": `Today`, `Tomorrow`, `In 5 days`, `Thu 24 Oct`. */
export function relativeDayBadge(b: BookingDetailResponse, now = new Date()): string {
  const start = startOf(b);
  const diff = dayDiff(start, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return `${WEEKDAYS[start.getDay()]} ${start.getDate()} ${MONTHS[start.getMonth()]}`;
}

/** `{ day: 'Tomorrow, Thu Oct 24', time: '15:00' }` (hero card) */
export function heroDateParts(b: BookingDetailResponse, now = new Date()): { day: string; time: string } {
  const start = startOf(b);
  const diff = dayDiff(start, now);
  const base = `${WEEKDAYS[start.getDay()]} ${MONTHS[start.getMonth()]} ${start.getDate()}`;
  const prefix = diff === 0 ? 'Today, ' : diff === 1 ? 'Tomorrow, ' : '';
  return { day: prefix + base, time: `${pad(start.getHours())}:${pad(start.getMinutes())}` };
}

/** `Friday, Nov 1 • 11:30` (compact cards) */
export function compactDate(b: BookingDetailResponse): string {
  const start = startOf(b);
  return `${WEEKDAYS_LONG[start.getDay()]}, ${MONTHS[start.getMonth()]} ${start.getDate()} • ${pad(start.getHours())}:${pad(start.getMinutes())}`;
}

/** `November 2026` */
export function monthLabel(b: BookingDetailResponse): string {
  const start = startOf(b);
  return `${MONTHS_LONG[start.getMonth()]} ${start.getFullYear()}`;
}

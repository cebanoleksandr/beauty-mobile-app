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
import { i18n } from '../../i18n';
import * as dates from '../../i18n/dates';

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
  const label =
    perspective === 'master' && (status === 'PENDING' || status === 'REJECTED' || status === 'MISSED')
      ? i18n.t(`status.master.${status}`)
      : i18n.t(`status.client.${status}`);
  return { label, tone: TONES[perspective === 'master' && status === 'REJECTED' ? 'MASTER_REJECTED' : status] };
}

const TONES: Record<BookingStatus | 'MASTER_REJECTED', StatusTone> = {
  SCHEDULED: 'success',
  PENDING: 'pending',
  COMPLETED: 'success',
  MISSED: 'danger',
  REJECTED: 'danger',
  MASTER_REJECTED: 'muted',
  CANCELED: 'muted',
};

function dayDiff(date: Date, now: Date): number {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** Badge next to "Next appointment": `Today`, `Tomorrow`, `In 5 days`, `Thu, Oct 24` (localized). */
export function relativeDayBadge(b: BookingDetailResponse, now = new Date()): string {
  const start = startOf(b);
  const diff = dayDiff(start, now);
  if (diff === 0) return i18n.t('dates.today');
  if (diff === 1) return i18n.t('dates.tomorrow');
  if (diff > 1 && diff < 7) return i18n.t('dates.inDays', { count: diff });
  return dates.weekdayDayMonth(start);
}

/** `{ day: 'Tomorrow, Thu Oct 24', time: '15:00' }` (hero card) */
export function heroDateParts(b: BookingDetailResponse, now = new Date()): { day: string; time: string } {
  const start = startOf(b);
  const diff = dayDiff(start, now);
  const base = dates.weekdayDayMonth(start);
  const day =
    diff === 0
      ? i18n.t('dates.todayPrefix', { date: base })
      : diff === 1
      ? i18n.t('dates.tomorrowPrefix', { date: base })
      : base;
  return { day, time: `${pad(start.getHours())}:${pad(start.getMinutes())}` };
}

/** `Friday, Nov 1 • 11:30` (compact cards) */
export function compactDate(b: BookingDetailResponse): string {
  const start = startOf(b);
  return i18n.t('dates.dateTime', {
    date: `${dates.weekdayLong(start)}, ${dates.dayMonthShort(start)}`,
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
  });
}

/** `November 2026` */
export function monthLabel(b: BookingDetailResponse): string {
  const start = startOf(b);
  return dates.monthYear(start);
}

/**
 * Slot maths for the booking screen. The backend opens 30-minute slots and a
 * booking needs every slot its duration spans, starting exactly at the chosen
 * time, none occupied (BookingFlowService.create). Same rules as the web
 * app's `slots.ts`, plus an explicit check that the slots are contiguous.
 */
import type { AvailabilityDayDto, TimeSlotDto } from '../../api';

export const SLOT_MINUTES = 30;

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** `HH:mm` + minutes → `HH:mm`. */
export function addMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) + minutes;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** Start times with enough contiguous free slots for a service of this length. */
export function validStarts(slots: readonly TimeSlotDto[], durationMinutes: number): Set<string> {
  const needed = Math.max(1, Math.ceil(durationMinutes / SLOT_MINUTES));
  const result = new Set<string>();
  for (let i = 0; i + needed <= slots.length; i++) {
    const run = slots.slice(i, i + needed);
    const contiguous = run.every((s, k) => toMinutes(s.time) === toMinutes(slots[i].time) + k * SLOT_MINUTES);
    if (contiguous && run.every(s => s.available)) result.add(slots[i].time);
  }
  return result;
}

export type Period = 'Morning' | 'Afternoon' | 'Evening';

export function periodOf(time: string): Period {
  const h = Math.floor(toMinutes(time) / 60);
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

/** Slots grouped by part of day, in order, skipping empty groups. */
export function groupByPeriod(slots: readonly TimeSlotDto[]): { period: Period; slots: TimeSlotDto[] }[] {
  const order: Period[] = ['Morning', 'Afternoon', 'Evening'];
  return order
    .map(period => ({ period, slots: slots.filter(s => periodOf(s.time) === period) }))
    .filter(g => g.slots.length > 0);
}

/** Local `YYYY-MM-DD`. */
export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Monday-based weeks from the current week up to the last availability day
 * (the backend serves a 14-day horizon). Each week is 7 `YYYY-MM-DD` strings.
 */
export function buildWeeks(days: readonly AvailabilityDayDto[], now = new Date()): string[][] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // back to Monday
  const last = days.length ? parseDay(days[days.length - 1].date) : new Date(start);
  const weeks: string[][] = [];
  const cursor = new Date(start);
  do {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(isoDay(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  } while (cursor <= last);
  return weeks;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const weekdayShort = (iso: string) => WEEKDAYS[parseDay(iso).getDay()];
export const dayOfMonth = (iso: string) => parseDay(iso).getDate();
export const monthYear = (iso: string) => {
  const d = parseDay(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const monthShort = (iso: string) => MONTHS[parseDay(iso).getMonth()].slice(0, 3);

/** `Thu 24 Oct, 15:00 – 17:30`. */
export function formatAppointment(date: string, time: string, durationMinutes: number): string {
  const d = parseDay(date);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${monthShort(date)}, ${time} – ${addMinutes(time, durationMinutes)}`;
}

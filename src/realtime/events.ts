/**
 * Single place that maps a realtime event to the cached queries it makes
 * stale (same table as the web app's core/realtime/events.ts). Add new event
 * kinds here rather than invalidating ad hoc in screens.
 */
import type { BookingRealtimeMessage } from '../api';
import { qk, queryClient } from '../query';

function invalidate(...keys: readonly (readonly unknown[])[]): void {
  for (const queryKey of keys) queryClient.invalidateQueries({ queryKey });
}

/** A booking this user is part of (as client or master) changed. */
export function onBookingChanged(msg?: BookingRealtimeMessage): void {
  invalidate(qk.bookings.all(), qk.master.slots());
  // A booking occupies/frees a slot, so that master's public availability moved too.
  if (msg) invalidate(qk.masters.availability(msg.masterId));
}

/** A master's free slots changed (added, removed or taken). */
export function onAvailabilityChanged(masterId: number): void {
  invalidate(qk.masters.availability(masterId));
}

/** Catch-up after a window where messages may have been missed (reconnect, app back in foreground). */
export function onResync(watchedMasterIds: Iterable<number>): void {
  invalidate(qk.bookings.all(), qk.master.slots());
  for (const id of watchedMasterIds) invalidate(qk.masters.availability(id));
}

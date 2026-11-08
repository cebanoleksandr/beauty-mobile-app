/** Builds the master's client list from completed bookings (service actually received). */
import type { BookingDetailResponse, Translations } from '../../../api';

/** Completed visits needed for the "Loyal" badge (same as the web app). */
export const LOYAL_MIN_VISITS = 5;

export interface ClientSummary {
  id: number;
  name: string;
  avatarUrl: string | null;
  rating: number | null;
  visits: number;
  revenue: number;
  lastVisit: string;
  lastService: Translations;
  /** Completed visits, newest first. */
  history: BookingDetailResponse[];
}

export function summarizeClients(bookings: readonly BookingDetailResponse[]): ClientSummary[] {
  const byClient = new Map<number, ClientSummary>();
  for (const b of bookings) {
    if (b.status !== 'COMPLETED') continue;
    const prev = byClient.get(b.clientId);
    const newer = !prev || b.scheduledTime > prev.lastVisit;
    byClient.set(b.clientId, {
      id: b.clientId,
      name: b.clientName,
      avatarUrl: b.clientAvatarUrl ?? prev?.avatarUrl ?? null,
      rating: b.clientAverageRating ?? prev?.rating ?? null,
      visits: (prev?.visits ?? 0) + 1,
      revenue: (prev?.revenue ?? 0) + b.price,
      lastVisit: newer ? b.scheduledTime : prev!.lastVisit,
      lastService: newer ? b.serviceName : prev!.lastService,
      history: [...(prev?.history ?? []), b],
    });
  }
  return [...byClient.values()].map(c => ({
    ...c,
    history: [...c.history].sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime)),
  }));
}

export type ClientFilter = 'all' | 'new' | 'loyal';
export type ClientSort = 'recent' | 'alphabet' | 'revenue';

export function filterClients(
  clients: readonly ClientSummary[],
  query: string,
  filter: ClientFilter,
  sort: ClientSort,
): ClientSummary[] {
  const q = query.trim().toLowerCase();
  return clients
    .filter(c => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (filter === 'new') return c.visits === 1;
      if (filter === 'loyal') return c.visits >= LOYAL_MIN_VISITS;
      return true;
    })
    .sort((a, b) =>
      sort === 'alphabet'
        ? a.name.localeCompare(b.name)
        : sort === 'revenue'
        ? b.revenue - a.revenue
        : b.lastVisit.localeCompare(a.lastVisit),
    );
}

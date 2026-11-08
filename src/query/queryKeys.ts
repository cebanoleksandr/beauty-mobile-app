/**
 * Centralised query-key factory — every hook takes its key from here so
 * invalidations stay in lockstep with reads. Mirrors the web app's `qk`.
 *
 * Conventions: resource first, scope second; filters as the last segment.
 * Prefix keys (`all`) exist so a whole family can be invalidated at once.
 */
import type {
  BookingScope,
  CatalogRequestStatus,
  MasterSearchRequest,
  ReportStatus,
  Uuid,
} from '../api';

export const qk = {
  me: () => ['me'] as const,

  catalog: () => ['catalog'] as const,

  masters: {
    all: () => ['masters'] as const,
    nearby: (lat: number, lon: number, radius?: number) =>
      ['masters', 'nearby', { lat, lon, radius }] as const,
    search: (req: MasterSearchRequest | null) => ['masters', 'search', req] as const,
    detail: (id: number) => ['masters', id] as const,
    availability: (id: number) => ['masters', id, 'availability'] as const,
    reviews: (id: number) => ['masters', id, 'reviews'] as const,
  },

  client: (id: number) => ['clients', id] as const,

  bookings: {
    all: () => ['bookings'] as const,
    list: (scope: BookingScope) => ['bookings', 'list', scope] as const,
    detail: (id: Uuid) => ['bookings', 'detail', id] as const,
  },

  master: {
    all: () => ['master'] as const,
    offers: () => ['master', 'offers'] as const,
    servicePoints: () => ['master', 'service-points'] as const,
    slots: () => ['master', 'slots'] as const,
  },

  admin: {
    all: () => ['admin'] as const,
    users: (search?: string) => ['admin', 'users', search ?? ''] as const,
    usersAll: () => ['admin', 'users'] as const,
    admins: () => ['admin', 'admins'] as const,
    catalogRequests: (status: CatalogRequestStatus) => ['admin', 'catalog-requests', status] as const,
    catalogRequestsAll: () => ['admin', 'catalog-requests'] as const,
    reports: (status: ReportStatus) => ['admin', 'reports', status] as const,
    reportsAll: () => ['admin', 'reports'] as const,
  },
} as const;

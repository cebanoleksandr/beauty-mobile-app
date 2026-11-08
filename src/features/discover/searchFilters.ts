/**
 * Map-search filters — same model as the web app (frontend/src/features/discover/types.ts,
 * clientFilters.ts).
 *
 * Applied by the backend: text query, center + radius, service ids, sort by distance/rating.
 * Applied here: favorites only (no backend favorites), price range and price sorting
 * (no price filter on the backend).
 */
import type { LngLat } from '@maplibre/maplibre-react-native';
import type { MasterCardDto, MasterSearchRequest } from '../../api';

export type SortBy = 'geo_distance' | 'rating_desc' | 'price_asc' | 'price_desc';

/** Radii offered in the filters (the backend accepts 500..20000). */
export const RADIUS_OPTIONS = [1000, 3000, 5000, 10000, 20000] as const;

/** Price slider bounds (₴). A bound left at its extreme means "no limit". */
export const PRICE_MIN = 100;
export const PRICE_MAX = 5000;
export const PRICE_STEP = 100;

export interface SearchFilters {
  sortBy: SortBy;
  /** Selected *service definition* ids — the backend matches them against offers. */
  categoryIds: string[];
  favoritesOnly: boolean;
  radiusMeters: number;
  priceMin: number;
  priceMax: number;
}

export const DEFAULT_FILTERS: SearchFilters = {
  sortBy: 'geo_distance',
  categoryIds: [],
  favoritesOnly: false,
  radiusMeters: 5000,
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
};

/** Wire request for POST /api/masters/search. */
export function buildSearchRequest(f: SearchFilters, query: string, center: LngLat): MasterSearchRequest {
  return {
    search_query: query.trim() || undefined,
    // Price sorting is client-side; ask the backend for distance order then.
    sort_by: f.sortBy === 'rating_desc' ? 'rating_desc' : 'geo_distance',
    category_ids: f.categoryIds.length ? f.categoryIds : undefined,
    favorites_only: f.favoritesOnly,
    center: { lat: center[1], lng: center[0] },
    radius_meters: f.radiusMeters,
  };
}

/**
 * The filters the backend doesn't apply, run over a search result. Shared by
 * the screen and the filters sheet's "Show N masters" so the two always agree.
 */
export function applyClientFilters(
  list: readonly MasterCardDto[],
  f: SearchFilters,
  favoriteIds: ReadonlySet<number>,
): MasterCardDto[] {
  const price = (m: MasterCardDto) => m.startingPrice ?? 0;
  let out = [...list];
  if (f.favoritesOnly) out = out.filter(m => favoriteIds.has(m.id));
  if (f.priceMin > PRICE_MIN) out = out.filter(m => price(m) >= f.priceMin);
  if (f.priceMax < PRICE_MAX) out = out.filter(m => price(m) <= f.priceMax);
  if (f.sortBy === 'price_asc') out.sort((a, b) => price(a) - price(b));
  else if (f.sortBy === 'price_desc') out.sort((a, b) => price(b) - price(a));
  return out;
}

/** Distinct masters (a master with several service points comes back as several cards). */
export function countMasters(list: readonly MasterCardDto[]): number {
  return new Set(list.map(m => m.id)).size;
}

/** How many filters differ from the defaults (badge on the filters button). */
export function countActiveFilters(f: SearchFilters): number {
  return (
    (f.sortBy !== DEFAULT_FILTERS.sortBy ? 1 : 0) +
    f.categoryIds.length +
    (f.favoritesOnly ? 1 : 0) +
    (f.radiusMeters !== DEFAULT_FILTERS.radiusMeters ? 1 : 0) +
    (f.priceMin !== DEFAULT_FILTERS.priceMin || f.priceMax !== DEFAULT_FILTERS.priceMax ? 1 : 0)
  );
}

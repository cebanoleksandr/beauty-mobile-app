/**
 * Filters behind the search bar's filter button. Mapped onto the backend's
 * `MasterSearchRequest` (category_ids, sort_by, radius_meters); "favorites
 * only" is applied client-side because the backend ignores it.
 */
export type SortOption = 'distance' | 'rating';

export interface SearchFilters {
  categoryIds: string[];
  sort: SortOption;
  /** 500..20000 (backend bounds). */
  radiusMeters: number;
  favoritesOnly: boolean;
}

export const RADIUS_OPTIONS = [1000, 3000, 5000, 10000, 20000] as const;

export const DEFAULT_FILTERS: SearchFilters = {
  categoryIds: [],
  sort: 'distance',
  radiusMeters: 5000,
  favoritesOnly: false,
};

/** Number of filters that differ from the defaults (badge on the filter button). */
export function countActiveFilters(f: SearchFilters): number {
  return (
    (f.categoryIds.length > 0 ? 1 : 0) +
    (f.sort !== DEFAULT_FILTERS.sort ? 1 : 0) +
    (f.radiusMeters !== DEFAULT_FILTERS.radiusMeters ? 1 : 0) +
    (f.favoritesOnly ? 1 : 0)
  );
}

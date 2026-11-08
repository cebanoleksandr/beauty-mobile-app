import type { MasterCardDto } from '../src/api';
import {
  DEFAULT_FILTERS,
  PRICE_MAX,
  applyClientFilters,
  buildSearchRequest,
  countActiveFilters,
  countMasters,
} from '../src/features/discover/searchFilters';

const card = (id: number, price: number, pinId = String(id)): MasterCardDto => ({
  id,
  pinId,
  displayName: `M${id}`,
  rating: 4.5,
  distanceMeters: 100,
  avatarUrl: null,
  lat: 0,
  lng: 0,
  startingPrice: price,
  category: null,
  services: [],
});

test('buildSearchRequest maps filters to the backend payload', () => {
  const req = buildSearchRequest(
    { ...DEFAULT_FILTERS, sortBy: 'price_asc', categoryIds: ['svc-1'], radiusMeters: 3000 },
    '  nails ',
    [30.5, 50.4],
  );
  expect(req).toEqual({
    search_query: 'nails',
    sort_by: 'geo_distance', // price sorting is client-side
    category_ids: ['svc-1'],
    favorites_only: false,
    center: { lat: 50.4, lng: 30.5 }, // LngLat is [lng, lat]
    radius_meters: 3000,
  });
  expect(buildSearchRequest({ ...DEFAULT_FILTERS, sortBy: 'rating_desc' }, '', [0, 0]).sort_by).toBe('rating_desc');
  expect(buildSearchRequest(DEFAULT_FILTERS, '', [0, 0]).category_ids).toBeUndefined();
});

test('applyClientFilters handles price range, price sort and favorites', () => {
  const list = [card(1, 300), card(2, 900), card(3, 150)];
  expect(applyClientFilters(list, { ...DEFAULT_FILTERS, priceMin: 200 }, new Set()).map(m => m.id)).toEqual([1, 2]);
  expect(applyClientFilters(list, { ...DEFAULT_FILTERS, priceMax: 500 }, new Set()).map(m => m.id)).toEqual([1, 3]);
  expect(applyClientFilters(list, { ...DEFAULT_FILTERS, sortBy: 'price_asc' }, new Set()).map(m => m.id)).toEqual([
    3, 1, 2,
  ]);
  expect(applyClientFilters(list, { ...DEFAULT_FILTERS, sortBy: 'price_desc' }, new Set()).map(m => m.id)).toEqual([
    2, 1, 3,
  ]);
  expect(applyClientFilters(list, { ...DEFAULT_FILTERS, favoritesOnly: true }, new Set([2])).map(m => m.id)).toEqual([
    2,
  ]);
  // Bounds at their extremes mean "no limit".
  expect(applyClientFilters([card(4, 99999)], { ...DEFAULT_FILTERS, priceMax: PRICE_MAX }, new Set())).toHaveLength(1);
});

test('countActiveFilters / countMasters', () => {
  expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
  expect(
    countActiveFilters({ ...DEFAULT_FILTERS, categoryIds: ['a', 'b'], favoritesOnly: true, priceMin: 500 }),
  ).toBe(4);
  expect(countMasters([card(1, 1, 'p1'), card(1, 1, 'p2'), card(2, 1)])).toBe(2);
});

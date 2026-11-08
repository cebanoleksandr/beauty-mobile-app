import type { LngLat } from '@maplibre/maplibre-react-native';

/**
 * Vector basemaps from OpenFreeMap — free, no API key, no usage limits.
 * The "layers" map control toggles between them. OSM attribution is shown
 * by the map's built-in attribution button (required by the data licence).
 */
export const MAP_STYLES = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/liberty',
} as const;

export type MapStyleName = keyof typeof MAP_STYLES;

/** Kyiv — used until (or unless) the user shares their location. */
export const DEFAULT_CENTER: LngLat = [30.5234, 50.4501];
export const DEFAULT_ZOOM = 13;
export const MIN_ZOOM = 4;
export const MAX_ZOOM = 18;

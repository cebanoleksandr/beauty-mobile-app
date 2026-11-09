import type { LngLat } from '@maplibre/maplibre-react-native';

const EARTH_RADIUS_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters. Note: LngLat is [longitude, latitude]. */
export function distanceMeters([lon1, lat1]: LngLat, [lon2, lat2]: LngLat): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

const deg = (r: number) => (r * 180) / Math.PI;

/** Point `distance` meters from `origin` along `bearing` (radians). */
function destination([lon, lat]: LngLat, distance: number, bearing: number): LngLat {
  const d = distance / EARTH_RADIUS_M;
  const φ1 = rad(lat);
  const λ1 = rad(lon);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(bearing));
  const λ2 = λ1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
  return [deg(λ2), deg(φ2)];
}

/** The search area as a GeoJSON polygon (a geodesic circle, `steps` vertices). */
export function circlePolygon(center: LngLat, radiusMeters: number, steps = 72): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring: LngLat[] = [];
  for (let i = 0; i <= steps; i++) ring.push(destination(center, radiusMeters, (i / steps) * 2 * Math.PI));
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring as number[][]] } };
}

/** [west, south, east, north] box around the circle — for `camera.fitBounds`. */
export function circleBounds(center: LngLat, radiusMeters: number): [number, number, number, number] {
  const [, north] = destination(center, radiusMeters, 0);
  const [east] = destination(center, radiusMeters, Math.PI / 2);
  const [, south] = destination(center, radiusMeters, Math.PI);
  const [west] = destination(center, radiusMeters, (3 * Math.PI) / 2);
  return [west, south, east, north];
}

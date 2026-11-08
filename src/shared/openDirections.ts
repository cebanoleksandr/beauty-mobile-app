import { Linking, Platform } from 'react-native';

/**
 * Google Maps directions from the user's current location (no `origin` →
 * Google uses "my location") to a destination: `"lat,lng"` or a street address.
 *
 * - Android: the https URL is handled by the Google Maps app (route opens directly).
 * - iOS: the Google Maps app via its URL scheme when installed (declared in
 *   Info.plist `LSApplicationQueriesSchemes`), otherwise the same https URL —
 *   Google Maps on the web, also with the route.
 */
export function googleMapsDirectionsUrl(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

export async function openDirectionsTo(destination: string): Promise<void> {
  if (Platform.OS === 'ios') {
    const appUrl = `comgooglemaps://?daddr=${encodeURIComponent(destination)}&directionsmode=driving`;
    try {
      if (await Linking.canOpenURL(appUrl)) {
        await Linking.openURL(appUrl);
        return;
      }
    } catch {
      // Fall through to the web URL.
    }
  }
  await Linking.openURL(googleMapsDirectionsUrl(destination));
}

/** Directions to coordinates. */
export function openDirections(lat: number, lng: number): Promise<void> {
  return openDirectionsTo(`${lat},${lng}`);
}

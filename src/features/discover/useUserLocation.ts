import { LocationManager, type LngLat } from '@maplibre/maplibre-react-native';
import { useCallback, useState } from 'react';

/**
 * Asks for location permission (via MapLibre's LocationManager) and returns
 * the current position. `granted` drives the user-location puck on the map.
 */
export function useUserLocation() {
  const [granted, setGranted] = useState(false);

  const locate = useCallback(async (): Promise<LngLat | null> => {
    try {
      const ok = await LocationManager.requestPermissions();
      setGranted(ok);
      if (!ok) return null;
      const position = await LocationManager.getCurrentPosition();
      return position ? [position.coords.longitude, position.coords.latitude] : null;
    } catch {
      return null;
    }
  }, []);

  return { granted, locate };
}

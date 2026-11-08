import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useIsSignedIn } from '../auth/sessionStore';
import { connectRealtime, disconnectRealtime, resyncRealtime, subscribeMasterAvailability } from './socket';

/**
 * Keeps the socket open while signed in (mounted once, at the root). The OS
 * suspends sockets in the background, so returning to the foreground
 * refetches live data; stompjs reconnects on its own.
 */
export function useRealtimeConnection(): void {
  const signedIn = useIsSignedIn();
  useEffect(() => {
    if (!signedIn) return;
    connectRealtime();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') resyncRealtime();
    });
    return () => {
      sub.remove();
      disconnectRealtime();
    };
  }, [signedIn]);
}

/** Live availability of one master while the calling screen is mounted. */
export function useMasterAvailabilityLive(masterId: number | null | undefined): void {
  useEffect(() => {
    if (masterId == null) return;
    return subscribeMasterAvailability(masterId);
  }, [masterId]);
}

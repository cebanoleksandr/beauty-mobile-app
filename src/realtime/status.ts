/**
 * Whether the STOMP socket is up. While it isn't, pushes are lost, so live
 * queries fall back to slow polling (`useLiveRefetchInterval`). Dual export
 * (hook + imperative singleton) like the other stores.
 */
import { useSyncExternalStore } from 'react';

let connected = false;
const listeners = new Set<() => void>();

export const realtimeStatus = {
  get connected(): boolean {
    return connected;
  },
  setConnected(next: boolean): void {
    if (connected === next) return;
    connected = next;
    listeners.forEach(l => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useRealtimeConnected(): boolean {
  return useSyncExternalStore(realtimeStatus.subscribe, () => realtimeStatus.connected);
}

export const FALLBACK_POLL_MS = 20_000;

/** `refetchInterval` for realtime-backed queries: none while the socket is up, a slow poll while down. */
export function useLiveRefetchInterval(): number | false {
  return useRealtimeConnected() ? false : FALLBACK_POLL_MS;
}

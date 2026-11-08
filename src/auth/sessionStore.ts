/**
 * Holds the Telegram `initData` credential the API client sends as
 * `Authorization: tma <initData>`. Dual export (hook + imperative singleton),
 * same pattern as the web app's tokenStore, so non-React code (the HTTP
 * client, the 401 handler) can read it too.
 *
 * In-memory only for now: the credential expires on the backend after
 * `init-data-ttl-seconds` anyway, so users sign in again on cold start.
 */
import { useSyncExternalStore } from 'react';

type Listener = () => void;

let credential: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export const sessionStore = {
  get credential(): string | null {
    return credential;
  },
  get isSignedIn(): boolean {
    return credential !== null;
  },
  set(next: string): void {
    credential = next;
    emit();
  },
  clear(): void {
    if (credential === null) return;
    credential = null;
    emit();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Re-renders when the user signs in or out. */
export function useIsSignedIn(): boolean {
  return useSyncExternalStore(sessionStore.subscribe, () => sessionStore.isSignedIn);
}

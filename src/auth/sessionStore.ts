/**
 * Holds the mobile session token (from signing in through the Telegram bot)
 * that the API client sends as `Authorization: Bearer <token>`. Dual export
 * (hook + imperative singleton), same pattern as the web app's tokenStore, so
 * non-React code (the HTTP client, the 401 handler) can read it too.
 *
 * Persisted in AsyncStorage so the user stays signed in across launches; the
 * server keeps the session alive for 90 days of inactivity. Call `hydrate()`
 * once at startup before deciding between Login and the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

const STORAGE_KEY = 'slotly.session.v1';

let token: string | null = null;
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

function persist(value: string | null) {
  (value ? AsyncStorage.setItem(STORAGE_KEY, value) : AsyncStorage.removeItem(STORAGE_KEY)).catch(() => {
    // Storage failure only costs a re-login on next launch.
  });
}

export const sessionStore = {
  get token(): string | null {
    return token;
  },
  /** Full `Authorization` header value, or null when signed out. */
  get authorization(): string | null {
    return token ? `Bearer ${token}` : null;
  },
  get isSignedIn(): boolean {
    return token !== null;
  },
  get isHydrated(): boolean {
    return hydrated;
  },
  /** Loads the saved session (once). */
  hydrate(): Promise<void> {
    hydrating ??= AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        // A sign-in that finished while we were reading wins.
        if (token === null && saved) token = saved;
      })
      .catch(() => {})
      .finally(() => {
        hydrated = true;
        emit();
      });
    return hydrating;
  },
  set(next: string): void {
    token = next;
    hydrated = true;
    persist(next);
    emit();
  },
  clear(): void {
    if (token === null) return;
    token = null;
    persist(null);
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

/** False until the saved session has been read at startup. */
export function useSessionHydrated(): boolean {
  return useSyncExternalStore(sessionStore.subscribe, () => sessionStore.isHydrated);
}

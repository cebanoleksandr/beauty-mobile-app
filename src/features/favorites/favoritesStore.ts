/**
 * Favorite masters, kept on the device.
 *
 * The backend has no favorites endpoint (`MasterSearchRequest.favorites_only`
 * is accepted but not applied server-side), so — like the web app — favorites
 * live on the client and the "favorites only" filter runs client-side.
 * Dual export (hook + imperative singleton), same pattern as `sessionStore`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'favorites.masterIds.v1';

type Listener = () => void;

let ids: ReadonlySet<number> = new Set();
let loaded = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])).catch(() => {
    // Best effort — the in-memory set stays correct for this session.
  });
}

export const favoritesStore = {
  get ids(): ReadonlySet<number> {
    return ids;
  },
  has(masterId: number): boolean {
    return ids.has(masterId);
  },
  async load(): Promise<void> {
    if (loaded) return;
    loaded = true;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        // Merge, so toggles made before the load finished aren't lost.
        ids = new Set([...parsed.filter((v): v is number => typeof v === 'number'), ...ids]);
        emit();
      }
    } catch {
      // Corrupt / unavailable storage — start empty.
    }
  },
  toggle(masterId: number): void {
    const next = new Set(ids);
    if (next.has(masterId)) next.delete(masterId);
    else next.add(masterId);
    ids = next;
    emit();
    persist();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Set of favorite master ids; re-renders on change. Loads from storage on first use. */
export function useFavoriteIds(): ReadonlySet<number> {
  favoritesStore.load();
  return useSyncExternalStore(favoritesStore.subscribe, () => favoritesStore.ids);
}

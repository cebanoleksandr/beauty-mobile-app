/**
 * The user's language choice: follow the device ("system", default) or a
 * fixed language. Persisted in AsyncStorage and applied on startup.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { deviceLanguage, i18n, isSupportedLang, type SupportedLang } from './i18n';

export type LanguagePreference = 'system' | SupportedLang;

const STORAGE_KEY = 'slotly.language.v1';
let preference: LanguagePreference = 'system';
const listeners = new Set<() => void>();

function apply() {
  const lang = preference === 'system' ? deviceLanguage() : preference;
  if (i18n.language !== lang) i18n.changeLanguage(lang);
  listeners.forEach(l => l());
}

export const languagePreference = {
  get value(): LanguagePreference {
    return preference;
  },
  set(next: LanguagePreference): void {
    preference = next;
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    apply();
  },
  async hydrate(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'system' || isSupportedLang(saved)) preference = saved;
    } catch {
      // keep "system"
    }
    apply();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useLanguagePreference(): LanguagePreference {
  return useSyncExternalStore(languagePreference.subscribe, () => preference);
}

/**
 * Base URL of the Slotly backend (Spring Boot, `backend/`).
 *
 * - Android emulator reaches the host machine via 10.0.2.2.
 * - iOS simulator can use localhost.
 * - Real devices / production: point at the API domain (Caddy, `API_DOMAIN`).
 *
 * Override at runtime with `setApiBaseUrl` (e.g. from a build-time config).
 */
import { Platform } from 'react-native';

const DEFAULT_DEV_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

let apiBaseUrl = DEFAULT_DEV_URL;

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url.replace(/\/$/, '');
}

/** Request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 15_000;

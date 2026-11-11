/**
 * Base URL of the Slotly backend (Spring Boot, `backend/`).
 *
 * - Build for a real phone with `SLOTSY_API_URL=https://… ` set: it is inlined at
 *   bundle time (babel.config.js) — e.g. the API domain (Caddy, `API_DOMAIN`) or
 *   the dev ngrok tunnel (`PUBLIC_BASE_URL`).
 * - Otherwise (dev): the Android emulator reaches the host machine via 10.0.2.2,
 *   the iOS simulator via localhost.
 *
 * Override at runtime with `setApiBaseUrl`.
 */
import { Platform } from 'react-native';

const DEFAULT_DEV_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

const BUILD_URL = process.env.SLOTSY_API_URL;

let apiBaseUrl = (BUILD_URL || DEFAULT_DEV_URL).replace(/\/$/, '');

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url.replace(/\/$/, '');
}

/** Request timeout in milliseconds. */
export const REQUEST_TIMEOUT_MS = 15_000;

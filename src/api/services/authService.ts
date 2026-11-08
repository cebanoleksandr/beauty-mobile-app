/**
 * `auth/controller/MobileAuthController` — /api/auth/mobile/*
 *
 * Sign-in for this native app: `start` → open `botUrl` in Telegram → the user
 * taps "Confirm sign-in" in the bot → `poll` returns a session token (once),
 * sent afterwards as `Authorization: Bearer <token>`.
 */
import { http } from '../client';
import type { MobileLoginPollResponse, MobileLoginStartResponse } from '../types';

export const authService = {
  start: () => http.post<MobileLoginStartResponse>('/api/auth/mobile/start', undefined, { skipAuth: true }),

  poll: (code: string, pollToken: string) =>
    http.post<MobileLoginPollResponse>('/api/auth/mobile/poll', { code, pollToken }, { skipAuth: true }),

  /** Revokes the session on the server (header passed explicitly: called while signing out). */
  logout: (authorization: string) =>
    http.post<void>('/api/auth/mobile/logout', undefined, { headers: { Authorization: authorization } }),
};

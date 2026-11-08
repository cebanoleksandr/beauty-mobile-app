import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { authService, NetworkError, setCredentialProvider, setUnauthorizedHandler, userService } from '../api';
import { qk } from '../query';
import { sessionStore } from './sessionStore';

// Wire the HTTP client to the session once, at module load.
setCredentialProvider(() => sessionStore.authorization);
setUnauthorizedHandler(() => sessionStore.clear());

const POLL_INTERVAL_MS = 2000;

export type BotLoginState =
  | { phase: 'idle' }
  | { phase: 'starting' }
  /** Telegram is open; waiting for the user to tap "Confirm sign-in" in the bot. */
  | { phase: 'waiting'; botUrl: string; expiresAt: number }
  | { phase: 'expired' }
  | { phase: 'error'; error: unknown };

export class TelegramNotInstalledError extends Error {
  constructor() {
    super('Could not open Telegram. Install the Telegram app and try again.');
    this.name = 'TelegramNotInstalledError';
  }
}

/**
 * "Continue with Telegram" via the bot (`/api/auth/mobile/*`):
 * start → open the bot link → poll every 2 s (and right away when the app
 * comes back to the foreground) → on confirmation verify the token with
 * `GET /api/user/me`, seed the `me` cache and store the session.
 */
export function useBotLogin() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BotLoginState>({ phase: 'idle' });
  const attempt = useRef<{ code: string; pollToken: string; expiresAt: number } | null>(null);
  const polling = useRef(false);

  const finish = useCallback(
    async (token: string) => {
      const authorization = `Bearer ${token}`;
      const me = await userService.getMe({ authorization });
      queryClient.setQueryData(qk.me(), me);
      sessionStore.set(token);
    },
    [queryClient],
  );

  const pollOnce = useCallback(async () => {
    const current = attempt.current;
    if (!current || polling.current) return;
    if (Date.now() > current.expiresAt) {
      attempt.current = null;
      setState({ phase: 'expired' });
      return;
    }
    polling.current = true;
    try {
      const res = await authService.poll(current.code, current.pollToken);
      if (attempt.current !== current) return; // cancelled meanwhile
      if (res.status === 'CONFIRMED') {
        attempt.current = null;
        await finish(res.token);
        setState({ phase: 'idle' });
      } else if (res.status === 'EXPIRED') {
        attempt.current = null;
        setState({ phase: 'expired' });
      }
    } catch (error) {
      // Transient network errors: keep polling until the attempt expires.
      if (attempt.current === current && !(error instanceof NetworkError)) {
        attempt.current = null;
        setState({ phase: 'error', error });
      }
    } finally {
      polling.current = false;
    }
  }, [finish]);

  const waiting = state.phase === 'waiting';
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(pollOnce, POLL_INTERVAL_MS);
    const sub = AppState.addEventListener('change', s => s === 'active' && pollOnce());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [waiting, pollOnce]);

  // Forget the attempt when the screen goes away.
  useEffect(
    () => () => {
      attempt.current = null;
    },
    [],
  );

  const openBot = useCallback(async (botUrl: string) => {
    try {
      await Linking.openURL(botUrl);
    } catch {
      throw new TelegramNotInstalledError();
    }
  }, []);

  const start = useCallback(async () => {
    setState({ phase: 'starting' });
    try {
      const res = await authService.start();
      const expiresAt = Date.now() + res.expiresInSeconds * 1000;
      attempt.current = { code: res.code, pollToken: res.pollToken, expiresAt };
      setState({ phase: 'waiting', botUrl: res.botUrl, expiresAt });
      await openBot(res.botUrl);
    } catch (error) {
      attempt.current = null;
      setState({ phase: 'error', error });
    }
  }, [openBot]);

  const cancel = useCallback(() => {
    attempt.current = null;
    setState({ phase: 'idle' });
  }, []);

  return { state, start, cancel, openBot, checkNow: pollOnce };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return () => {
    // Revoke on the server too; sign out locally even if that fails.
    const authorization = sessionStore.authorization;
    if (authorization) authService.logout(authorization).catch(() => {});
    sessionStore.clear();
    queryClient.clear();
  };
}

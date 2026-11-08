/**
 * Obtains a Telegram-signed credential for the backend.
 *
 * The backend (`auth/TelegramAuthFilter`) only accepts Mini App `initData`,
 * which Telegram hands to WebViews — a native app has no such source yet.
 * Until the backend gets a native login flow (e.g. Telegram Login Widget /
 * bot deep link), the source is pluggable:
 *
 *  - call `setTelegramCredentialSource(fn)` from the real login integration;
 *  - in development, `setTelegramCredentialSource(() => '<initData copied from the Mini App>')`.
 */

export class TelegramAuthUnavailableError extends Error {
  constructor() {
    super('Telegram sign-in is not configured for the mobile app yet.');
    this.name = 'TelegramAuthUnavailableError';
  }
}

type CredentialSource = () => Promise<string> | string;

let source: CredentialSource = () => {
  throw new TelegramAuthUnavailableError();
};

export function setTelegramCredentialSource(next: CredentialSource): void {
  source = next;
}

/** Resolves with raw `initData` (the part after `tma `). */
export async function requestTelegramCredential(): Promise<string> {
  const credential = (await source()).trim();
  if (!credential) throw new TelegramAuthUnavailableError();
  return credential;
}

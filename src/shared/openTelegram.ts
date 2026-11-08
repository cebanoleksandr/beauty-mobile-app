import { Linking } from 'react-native';

/** Opens a Telegram DM with `username` (the app has no in-app chat). */
export function openTelegramProfile(username: string | null | undefined): void {
  if (username) Linking.openURL(`https://t.me/${username.replace(/^@/, '')}`).catch(() => {});
}

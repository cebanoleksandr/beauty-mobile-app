/**
 * Where the mobile session token lives: the iOS Keychain / an Android
 * Keystore-encrypted store (react-native-keychain), not AsyncStorage, which
 * is plain files readable from backups or a rooted device.
 *
 * - iOS: `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` — readable in the background
 *   after the first unlock (realtime reconnects), never synced to iCloud or
 *   restored onto another device.
 * - Android: AES-GCM with a key held in the Android Keystore, no biometric
 *   prompt (`AES_GCM_NO_AUTH`).
 */
import * as Keychain from 'react-native-keychain';

const SERVICE = 'app.slotly.session';
const ACCOUNT = 'session';

export const secureSessionStorage = {
  async get(): Promise<string | null> {
    const entry = await Keychain.getGenericPassword({ service: SERVICE });
    return entry ? entry.password : null;
  },

  async set(token: string): Promise<void> {
    await Keychain.setGenericPassword(ACCOUNT, token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
  },

  async clear(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};

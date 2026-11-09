/** The session token lives in the Keychain/Keystore; an old AsyncStorage copy is migrated once. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const SERVICE = 'app.slotly.session';
const keychainStore = (Keychain as unknown as { __store: Map<string, { password: string }> }).__store;

function freshStore() {
  let mod!: typeof import('../src/auth/sessionStore');
  jest.isolateModules(() => {
    mod = require('../src/auth/sessionStore');
  });
  return mod.sessionStore;
}

const flushPersist = () => new Promise<void>(resolve => setTimeout(() => resolve(), 0));

beforeEach(async () => {
  keychainStore.clear();
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test('set() writes to the Keychain (device-only, Keystore AES-GCM) and not to AsyncStorage', async () => {
  const store = freshStore();
  store.set('tok-1');
  await flushPersist();
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith('session', 'tok-1', {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
  });
  expect(await AsyncStorage.getAllKeys()).toEqual([]);
  expect(store.authorization).toBe('Bearer tok-1');
});

test('hydrate() restores the token from the Keychain', async () => {
  keychainStore.set(SERVICE, { password: 'saved' });
  const store = freshStore();
  await store.hydrate();
  expect(store.isHydrated).toBe(true);
  expect(store.token).toBe('saved');
});

test('a token left in AsyncStorage by an older build moves into the Keychain and is deleted', async () => {
  await AsyncStorage.setItem('slotly.session.v1', 'legacy-tok');
  const store = freshStore();
  await store.hydrate();
  expect(store.token).toBe('legacy-tok');
  expect(keychainStore.get(SERVICE)?.password).toBe('legacy-tok');
  expect(await AsyncStorage.getItem('slotly.session.v1')).toBeNull();
});

test('clear() removes the token from the Keychain', async () => {
  keychainStore.set(SERVICE, { password: 'saved' });
  const store = freshStore();
  await store.hydrate();
  store.clear();
  await flushPersist();
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({ service: SERVICE });
  expect(keychainStore.has(SERVICE)).toBe(false);
  expect(store.isSignedIn).toBe(false);
});

test('a Keychain read failure means signed out, not a crash', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
  const store = freshStore();
  await store.hydrate();
  expect(store.isHydrated).toBe(true);
  expect(store.isSignedIn).toBe(false);
});

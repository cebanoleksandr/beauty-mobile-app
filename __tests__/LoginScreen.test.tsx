import React from 'react';
import { Alert, Linking } from 'react-native';
import { sessionStore } from '../src/auth';
import { LoginScreen } from '../src/features/auth/LoginScreen';
import { queryClient, qk } from '../src/query';
import { clearClient, flush, press, renderScreen, stubFetch, texts } from '../test-utils/screen';

afterEach(async () => {
  await clearClient();
  sessionStore.clear();
});

test('Continue with Telegram: opens the bot, polls, then stores the session', async () => {
  let pollStatus: 'PENDING' | 'CONFIRMED' = 'PENDING';
  const requests = stubFetch(({ url }) => {
    if (url.endsWith('/api/auth/mobile/start')) {
      return {
        body: { code: 'c1', pollToken: 'p1', botUrl: 'https://t.me/slotly_bot?start=login_c1', expiresInSeconds: 600 },
      };
    }
    if (url.endsWith('/api/auth/mobile/poll')) {
      return { body: pollStatus === 'CONFIRMED' ? { status: 'CONFIRMED', token: 'tok-1' } : { status: 'PENDING' } };
    }
    if (url.endsWith('/api/user/me')) return { body: { id: 42, firstName: 'Olena', context: 'CLIENT' } };
  });
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

  const tree = await renderScreen(<LoginScreen />);
  await press(tree, 'Continue with Telegram');
  await flush();
  expect(open).toHaveBeenCalledWith('https://t.me/slotly_bot?start=login_c1');
  expect(texts(tree)).toContain('Waiting for confirmation in Telegram');

  await press(tree, "I've confirmed");
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/poll'),
      body: { code: 'c1', pollToken: 'p1' },
    }),
  );
  expect(sessionStore.isSignedIn).toBe(false);

  pollStatus = 'CONFIRMED';
  await press(tree, "I've confirmed");
  await flush();
  expect(sessionStore.token).toBe('tok-1');
  expect(requests).toContainEqual(expect.objectContaining({ url: expect.stringContaining('/api/user/me') }));
  // The token is verified with its own header before being stored.
  const meCall = (globalThis.fetch as jest.Mock).mock.calls.find(([u]) => String(u).endsWith('/api/user/me'));
  expect(meCall[1].headers.Authorization).toBe('Bearer tok-1');
  open.mockRestore();
  queryClient.removeQueries({ queryKey: qk.me() });
});

test('an expired request asks to start again; Cancel returns to idle', async () => {
  stubFetch(({ url }) => {
    if (url.endsWith('/api/auth/mobile/start')) {
      return { body: { code: 'c2', pollToken: 'p2', botUrl: 'https://t.me/b?start=login_c2', expiresInSeconds: 600 } };
    }
    if (url.endsWith('/api/auth/mobile/poll')) return { body: { status: 'EXPIRED' } };
  });
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const tree = await renderScreen(<LoginScreen />);

  await press(tree, 'Continue with Telegram');
  await press(tree, 'Cancel');
  expect(texts(tree)).not.toContain('Waiting for confirmation in Telegram');

  await press(tree, 'Continue with Telegram');
  await press(tree, "I've confirmed");
  await flush();
  expect(texts(tree)).toContain('The sign-in request expired. Tap the button to try again.');
  open.mockRestore();
});

test('no Telegram app → explains it', async () => {
  stubFetch(({ url }) =>
    url.endsWith('/api/auth/mobile/start')
      ? { body: { code: 'c3', pollToken: 'p3', botUrl: 'https://t.me/b?start=login_c3', expiresInSeconds: 600 } }
      : undefined,
  );
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const tree = await renderScreen(<LoginScreen />);
  await press(tree, 'Continue with Telegram');
  await flush();
  expect(alert).toHaveBeenCalledWith('Sign-in failed', expect.stringContaining('Install the Telegram app'));
  open.mockRestore();
  alert.mockRestore();
});

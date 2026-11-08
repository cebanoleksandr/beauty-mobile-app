import React from 'react';
import { Alert, Text, TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { UserResponse } from '../src/api';
import { sessionStore } from '../src/auth';
import { SettingsScreen } from '../src/features/settings/SettingsScreen';
import { ThemeProvider } from '../src/theme';

const baseMe: UserResponse = {
  id: 42,
  username: 'annarostova',
  firstName: 'Anna',
  lastName: 'Rostova',
  photoUrl: null,
  context: 'CLIENT',
  masterProfile: { bio: 'Colorist', socialLinks: null, rating: 4.9, searchRadiusMeters: 5000, avatarUrl: null },
  telegramLinked: true,
  isAdmin: false,
};

let me: UserResponse;
let roleStatus = 200;
const requests: { method: string; url: string; body?: unknown }[] = [];

beforeEach(() => {
  me = { ...baseMe };
  roleStatus = 200;
  requests.length = 0;
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, url, body });
    const reply = (status: number, payload: unknown) =>
      ({ ok: status < 300, status, text: async () => JSON.stringify(payload) }) as Response;
    if (url.endsWith('/api/user/me/active-role')) {
      return roleStatus === 200 ? reply(200, { context: body.context }) : reply(400, { message: 'ERR_NO_ACTIVE_SERVICES' });
    }
    if (url.endsWith('/api/user/me') && method === 'PUT') {
      me = { ...me, ...body };
      return reply(200, me);
    }
    if (url.endsWith('/api/user/me')) return reply(200, me);
    return reply(200, []);
  }) as unknown as typeof fetch;
});

let client: QueryClient | undefined;
afterEach(() => client?.clear());

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const flush = () => act(async () => new Promise<void>(resolve => setTimeout(() => resolve(), 20)));

async function render(onOpenMasterProfile = jest.fn(), onBecomeMaster?: () => void) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client!}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={metrics}>
            <SettingsScreen onOpenMasterProfile={onOpenMasterProfile} onBecomeMaster={onBecomeMaster} />
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );
  });
  await flush();
  return tree;
}

const texts = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(n => [n.props.children].flat(Infinity).filter(c => typeof c === 'string' || typeof c === 'number').join(''))
    .join('\n');

const pressable = (tree: ReactTestRenderer.ReactTestRenderer, match: (props: any) => boolean) =>
  tree.root.findAll(n => typeof n.props.onPress === 'function' && match(n.props))[0];

const byText = (tree: ReactTestRenderer.ReactTestRenderer, text: string) =>
  tree.root
    .findAll(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => t.props.children === text))
    .pop()!;

test('shows backend profile data and none of the design-only rows', async () => {
  const onOpen = jest.fn();
  const tree = await render(onOpen);
  const all = texts(tree);
  expect(all).toContain('Anna Rostova');
  expect(all).toContain('@annarostova');
  expect(all).toContain('Both roles linked');
  expect(all).toContain('Telegram notifications');
  expect(all).toContain('On');
  expect(all).toContain('My master profile');
  expect(all).not.toMatch(/Phone number|Language|Payment|Help Center|Promotions|Booking reminders/);

  await act(async () => byText(tree, 'My master profile').props.onPress());
  expect(onOpen).toHaveBeenCalledWith(42);
  await act(async () => tree.unmount());
});

test('tapping Master opens the Switch Mode sheet; "Keep Current Mode" changes nothing', async () => {
  const tree = await render();
  await act(async () => pressable(tree, p => p.accessibilityLabel === 'Master mode').props.onPress());
  const all = texts(tree);
  expect(all).toContain('Switch Mode');
  expect(all).toContain('Switch to Master mode');
  expect(all).toContain('Your bookings are saved in both modes');

  await act(async () => byText(tree, 'Keep Current Mode').props.onPress());
  expect(texts(tree)).not.toContain('Switch to Master mode');
  expect(requests.some(r => r.url.endsWith('/active-role'))).toBe(false);
  await act(async () => tree.unmount());
});

test('confirming in the sheet PUTs the active role', async () => {
  const tree = await render();
  await act(async () => pressable(tree, p => p.accessibilityLabel === 'Master mode').props.onPress());
  await act(async () => byText(tree, 'Switch to Master mode').props.onPress());
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({ method: 'PUT', url: expect.stringContaining('/active-role'), body: { context: 'MASTER' } }),
  );
  await act(async () => tree.unmount());
});

test('master mode without active services explains the 400 and offers onboarding', async () => {
  roleStatus = 400;
  const onBecomeMaster = jest.fn();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    buttons?.find(b => b.text === 'Add services')?.onPress?.();
  });
  const tree = await render(jest.fn(), onBecomeMaster);
  await act(async () => pressable(tree, p => p.accessibilityLabel === 'Master mode').props.onPress());
  await act(async () => byText(tree, 'Switch to Master mode').props.onPress());
  await flush();
  expect(alert).toHaveBeenCalledWith(
    'Could not switch mode',
    'Add at least one active service to your master profile first.',
    expect.any(Array),
  );
  expect(onBecomeMaster).toHaveBeenCalled();
  alert.mockRestore();
  await act(async () => tree.unmount());
});

test('without a master profile the switch is blocked client-side', async () => {
  me = { ...baseMe, masterProfile: null };
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const tree = await render();
  expect(texts(tree)).not.toContain('Both roles linked');
  expect(texts(tree)).not.toContain('My master profile');
  await act(async () => pressable(tree, p => p.accessibilityLabel === 'Master mode').props.onPress());
  expect(alert).toHaveBeenCalledWith('No master profile yet', expect.any(String));
  expect(requests.some(r => r.url.endsWith('/active-role'))).toBe(false);
  alert.mockRestore();
  await act(async () => tree.unmount());
});

test('without a master profile, choosing Master opens the onboarding', async () => {
  me = { ...baseMe, masterProfile: null };
  const onBecomeMaster = jest.fn();
  const tree = await render(jest.fn(), onBecomeMaster);
  await act(async () => pressable(tree, p => p.accessibilityLabel === 'Master mode').props.onPress());
  expect(onBecomeMaster).toHaveBeenCalled();
  expect(texts(tree)).not.toContain('Switch to Master mode');
  await act(async () => tree.unmount());
});

test('edit profile saves first and last name', async () => {
  const tree = await render();
  await act(async () => byText(tree, 'Edit profile').props.onPress());
  const [first, last] = tree.root.findAllByType(TextInput).filter(i => i.props.placeholder?.includes('name'));
  await act(async () => first.props.onChangeText(' Hanna '));
  await act(async () => last.props.onChangeText('Lee'));
  await act(async () => byText(tree, 'Save').props.onPress());
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({ method: 'PUT', body: { firstName: 'Hanna', lastName: 'Lee' } }),
  );
  expect(texts(tree)).toContain('Hanna Lee');
  await act(async () => tree.unmount());
});

test('log out asks for confirmation and clears the session', async () => {
  sessionStore.set('session-token');
  const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    buttons?.find(b => b.style === 'destructive')?.onPress?.();
  });
  const tree = await render();
  await act(async () => byText(tree, 'Log Out').props.onPress());
  expect(sessionStore.isSignedIn).toBe(false);
  alert.mockRestore();
  await act(async () => tree.unmount());
});

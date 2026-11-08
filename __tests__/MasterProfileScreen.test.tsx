import React from 'react';
import { Linking, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { AvailabilityDayDto, MasterDetailDto } from '../src/api';
import { MasterProfileScreen } from '../src/features/master-profile/MasterProfileScreen';
import { formatRelativeDate, nextSlotLabel } from '../src/features/master-profile/profileFormat';
import { openDirections } from '../src/shared/openDirections';
import { ThemeProvider } from '../src/theme';

const master: MasterDetailDto = {
  id: 7,
  displayName: 'Elena Rostova',
  username: 'elena',
  title: { en: 'Hair', uk: 'Волосся' },
  category: { en: 'Hair', uk: 'Волосся' },
  rating: 4.9,
  reviewCount: 1,
  distanceMeters: null,
  avatarUrl: null,
  verified: true,
  bio: 'Colorist with a love for soft blondes.',
  portfolio: [],
  services: [
    { id: 's1', name: { en: 'Balayage' }, group: { en: 'Hair' }, durationMinutes: 150, price: 2400 },
    { id: 's2', name: { en: 'Gloss' }, group: { en: 'Hair' }, durationMinutes: 60, price: 950 },
  ],
  reviews: [{ id: 'r1', author: 'Camilla P', rating: 5, text: 'Elena is a true artist.', date: '2026-11-05' }],
};

const today = new Date();
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const availability: AvailabilityDayDto[] = [
  {
    date: iso(today),
    slots: [
      { time: '10:00', available: false },
      { time: '16:30', available: true },
    ],
  },
];

beforeEach(() => {
  globalThis.fetch = jest.fn(async (url: string) => {
    const body = url.endsWith('/api/masters/7') ? master : url.endsWith('/availability') ? availability : [];
    return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
  }) as unknown as typeof fetch;
});

let client: QueryClient;
afterEach(() => client.clear());

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const flush = () => act(async () => new Promise<void>(resolve => setTimeout(() => resolve(), 20)));

async function render(onBook = jest.fn()) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={metrics}>
            <MasterProfileScreen
              masterId={7}
              preview={{ distanceMeters: 480, lat: 50.45, lng: 30.52 }}
              onBack={jest.fn()}
              onBook={onBook}
            />
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
    .map(n => [n.props.children].flat(Infinity).filter(c => typeof c === 'string' || typeof c === 'number').join(''));

const press = async (tree: ReactTestRenderer.ReactTestRenderer, match: (props: any) => boolean) => {
  const node = tree.root.findAll(n => typeof n.props.onPress === 'function' && match(n.props))[0];
  expect(node).toBeDefined();
  await act(async () => node.props.onPress());
};

test('renders backend data and none of the design-only blocks', async () => {
  const tree = await render();
  const all = texts(tree).join('\n');

  expect(all).toContain('Elena Rostova');
  expect(all).toContain('Hair'); // title
  expect(all).toContain('Top master'); // verified
  expect(all).toContain('480 m away');
  expect(all).toContain('1 review');
  expect(all).toContain('Services (2)');
  expect(all).toContain('Balayage');
  expect(all).toContain('Starting from');
  expect(all).toContain('950 ₴');
  expect(all).toContain('Next: Today, 16:30');
  // No portfolio → no Portfolio tab; design-only metrics are absent.
  expect(all).not.toContain('Portfolio');
  expect(all).not.toMatch(/Experience|Clients|Open Now|Popular/);
  await act(async () => tree.unmount());
});

test('Book opens booking — with the service picked on the profile, if any', async () => {
  const onBook = jest.fn();
  const tree = await render(onBook);
  const bookNow = () =>
    tree.root
      .findAll(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => t.props.children === 'Book Now'))
      .pop()!;

  // Nothing selected yet → booking opens without a preselected service.
  await act(async () => bookNow().props.onPress());
  expect(onBook).toHaveBeenLastCalledWith(expect.objectContaining({ id: 7 }), null);

  await press(tree, p => p.accessibilityLabel === 'Select Gloss');
  await act(async () => bookNow().props.onPress());
  expect(onBook).toHaveBeenLastCalledWith(expect.objectContaining({ id: 7 }), expect.objectContaining({ id: 's2' }));
  await act(async () => tree.unmount());
});

test('reviews tab lists reviews', async () => {
  const tree = await render();
  await press(tree, p => p.accessibilityRole === 'tab' && p.accessibilityState?.selected === false);
  const all = texts(tree).join('\n');
  expect(all).toContain('Camilla P');
  expect(all).toContain('Elena is a true artist.');
  expect(all).toContain('Verified appointment');
  await act(async () => tree.unmount());
});

test('date helpers', () => {
  const now = new Date(2026, 10, 8, 12, 0);
  expect(nextSlotLabel([{ date: '2026-11-09', slots: [{ time: '11:00', available: true }] }], now)).toBe(
    'Tomorrow, 11:00',
  );
  expect(nextSlotLabel([{ date: '2026-11-08', slots: [{ time: '09:00', available: false }] }], now)).toBeNull();
  expect(formatRelativeDate('2026-11-05', now)).toBe('3 days ago');
  expect(formatRelativeDate('2026-11-08', now)).toBe('Today');
});

test('directions button opens Google Maps with a route to the master', async () => {
  const canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const tree = await render();

  await press(tree, p => p.accessibilityLabel === 'Get directions in Google Maps');
  expect(open).toHaveBeenCalledWith(
    'https://www.google.com/maps/dir/?api=1&destination=50.45%2C30.52&travelmode=driving',
  );
  await act(async () => tree.unmount());
  canOpen.mockRestore();
  open.mockRestore();
});

test('on iOS the Google Maps app is preferred when installed', async () => {
  const canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await openDirections(50.45, 30.52);
  expect(open).toHaveBeenCalledWith('comgooglemaps://?daddr=50.45%2C30.52&directionsmode=driving');
  canOpen.mockRestore();
  open.mockRestore();
});

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { MasterCardDto } from '../src/api';
import { MapSearchScreen } from '../src/features/discover/MapSearchScreen';
import { ThemeProvider } from '../src/theme';

const masters: MasterCardDto[] = [
  {
    id: 1,
    pinId: '1',
    displayName: 'Roman Kozak',
    rating: 4.0,
    distanceMeters: 365,
    avatarUrl: null,
    lat: 50.45,
    lng: 30.52,
    startingPrice: 500,
    category: { en: 'Electrics', uk: 'Електрика' },
    services: [],
  },
  {
    id: 2,
    pinId: '2',
    displayName: 'Kateryna Klymenko',
    rating: 4.9,
    distanceMeters: 484,
    avatarUrl: null,
    lat: 50.46,
    lng: 30.53,
    startingPrice: 250,
    category: { en: 'Nails', uk: 'Нігті' },
    services: [],
  },
];

const catalog = [
  {
    id: 'cat-nails',
    name: { en: 'Nails', uk: 'Нігті' },
    definitions: [
      { id: 'svc-gel', name: { en: 'Gel manicure', uk: 'Гель-лак' } },
      { id: 'svc-pedi', name: { en: 'Pedicure', uk: 'Педикюр' } },
    ],
  },
];

const searchBodies: Record<string, unknown>[] = [];

beforeEach(() => {
  searchBodies.length = 0;
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/masters/search')) searchBodies.push(JSON.parse(String(init?.body)));
    const body = url.endsWith('/api/masters/search') ? masters : url.endsWith('/api/catalog') ? catalog : [];
    return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
  }) as unknown as typeof fetch;
});

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

let client: QueryClient;
afterEach(() => client.clear());

async function renderScreen() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={metrics}>
            <MapSearchScreen />
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 20));
  });
  return tree;
}

/** All rendered text, one string per <Text> node (nested strings joined). */
const textOf = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(node =>
      [node.props.children]
        .flat(Infinity)
        .filter(c => typeof c === 'string' || typeof c === 'number')
        .join(''),
    )
    .join('\n');

test('searches around the default center and renders a card + pin per master', async () => {
  const tree = await renderScreen();

  expect(searchBodies[0]).toMatchObject({ center: { lat: 50.4501, lng: 30.5234 }, radius_meters: 5000 });
  const text = textOf(tree);
  expect(text).toContain('Roman Kozak');
  expect(text).toContain('Kateryna Klymenko');
  expect(text).toContain('(2 found)');
  expect(text).toContain('Electrics');
  expect(text).toContain('500 ₴');
  // Pins: "<price> · <first name>"
  expect(text).toContain('250 ₴ · Kateryna');
  await act(async () => tree.unmount());
});

test('bookmark toggles a favorite', async () => {
  const tree = await renderScreen();
  const addButtons = tree.root.findAll(n => n.props.accessibilityLabel === 'Add to favorites' && n.props.onPress);
  expect(addButtons.length).toBeGreaterThanOrEqual(2);

  await act(async () => addButtons[0].props.onPress());

  const removeButtons = tree.root.findAll(
    n => n.props.accessibilityLabel === 'Remove from favorites' && n.props.onPress,
  );
  expect(removeButtons.length).toBeGreaterThanOrEqual(1);
  // Clean up the shared store for other tests.
  await act(async () => removeButtons[0].props.onPress());
  await act(async () => tree.unmount());
});

const pressable = (tree: ReactTestRenderer.ReactTestRenderer, match: (props: any) => boolean) =>
  tree.root.findAll(n => typeof n.props.onPress === 'function' && match(n.props))[0];

const hasText = (node: ReactTestRenderer.ReactTestInstance, text: RegExp) =>
  node.findAllByType(Text).some(t => text.test([t.props.children].flat().join('')));

test('filters: choosing a service and applying sends its service id to the backend', async () => {
  const tree = await renderScreen();

  await act(async () => pressable(tree, p => p.accessibilityLabel === 'Filters').props.onPress());
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 20));
  });
  expect(textOf(tree)).toContain('Nails');

  // Expand the category, tick a service.
  await act(async () => pressable(tree, p => p.accessibilityState?.expanded === false).props.onPress());
  const gel = tree.root.findAll(
    n =>
      n.props.accessibilityRole === 'checkbox' && typeof n.props.onPress === 'function' && hasText(n, /Gel manicure/),
  )[0];
  await act(async () => gel.props.onPress());
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 20));
  });

  // CTA shows the live preview count, then applies.
  const cta = tree.root.findAll(
    n =>
      typeof n.props.onPress === 'function' &&
      n.props.accessibilityRole === 'button' &&
      hasText(n, /^Show \d+ masters?$/),
  )[0];
  expect(cta).toBeDefined();
  await act(async () => cta.props.onPress());
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 20));
  });

  expect(searchBodies[searchBodies.length - 1]).toMatchObject({ category_ids: ['svc-gel'] });
  // Filter badge: one active filter.
  expect(pressable(tree, p => p.accessibilityLabel === 'Filters, 1 active')).toBeDefined();
  await act(async () => tree.unmount());
});

test('tapping the map sets a new search center: pin + radius circle + search there (like the web app)', async () => {
  const tree = await renderScreen();
  const map = tree.root.findAll(n => n.props.mapStyle && typeof n.props.onPress === 'function')[0];
  const area = () => tree.root.findAll(n => n.props.id === 'search-area' && n.props.data)[0];
  const ringOf = () => area().props.data.geometry.coordinates[0] as [number, number][];

  // Before any tap: a circle around the default center, no manual pin.
  expect(tree.root.findAll(n => n.props.id === 'search-center' && n.props.lngLat)).toHaveLength(0);
  expect(tree.root.findAll(n => n.props.id === 'search-area-line' && n.props.paint).length).toBeGreaterThan(0);

  searchBodies.length = 0;
  await act(async () => map.props.onPress({ nativeEvent: { lngLat: [30.6, 50.5], point: [10, 10] } }));
  await act(async () => new Promise<void>(resolve => setTimeout(() => resolve(), 20)));

  const pin = tree.root.findAll(n => n.props.id === 'search-center' && n.props.lngLat)[0];
  expect(pin.props.lngLat).toEqual([30.6, 50.5]);

  // The circle is centered on the tap, with the filter radius (default 5 km).
  const ring = ringOf();
  const lats = ring.map(p => p[1]);
  expect((Math.max(...lats) + Math.min(...lats)) / 2).toBeCloseTo(50.5, 3);
  expect(((Math.max(...lats) - Math.min(...lats)) / 2) * 111_320).toBeCloseTo(5000, -2);

  expect(searchBodies[searchBodies.length - 1]).toMatchObject({
    center: { lat: 50.5, lng: 30.6 },
    radius_meters: 5000,
  });
  await act(async () => tree.unmount());
});

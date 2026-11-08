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

const searchBodies: unknown[] = [];

beforeEach(() => {
  searchBodies.length = 0;
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/masters/search')) searchBodies.push(JSON.parse(String(init?.body)));
    const body = url.endsWith('/api/masters/search') ? masters : [];
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
    .map(node => [node.props.children].flat(Infinity).filter(c => typeof c === 'string' || typeof c === 'number').join(''))
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

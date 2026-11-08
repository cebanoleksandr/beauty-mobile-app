import React from 'react';
import { Alert, Linking, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BookingDetailResponse, BookingStatus } from '../src/api';
import { BookingsScreen } from '../src/features/bookings/BookingsScreen';
import { canCancel, groupBookings, relativeDayBadge, tabOf } from '../src/features/bookings/bookingGroups';
import { ThemeProvider } from '../src/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const at = (daysFromNow: number, hh: number, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}:00`;
};

const booking = (id: string, status: BookingStatus, scheduledTime: string, extra: Partial<BookingDetailResponse> = {}) =>
  ({
    id,
    masterId: 7,
    masterName: `Master ${id}`,
    masterAvatarUrl: null,
    masterUsername: 'elena',
    masterAverageRating: 4.9,
    clientId: 1,
    clientName: 'Me',
    clientAvatarUrl: null,
    clientAverageRating: null,
    offerId: 'o1',
    serviceName: { en: `Service ${id}` },
    price: 1200,
    durationMinutes: 60,
    servicePointAddress: 'Khreshchatyk St 1, Kyiv',
    scheduledTime,
    status,
    clientReviewRating: null,
    clientReviewText: null,
    masterReviewRating: null,
    masterReviewText: null,
    ...extra,
  }) as BookingDetailResponse;

// ---------------------------------------------------------------- grouping

test('groups by status and time; upcoming soonest first', () => {
  const list = [
    booking('later', 'PENDING', at(5, 11)),
    booking('next', 'SCHEDULED', at(1, 15)),
    booking('done', 'COMPLETED', at(-3, 10)),
    booking('overdue', 'SCHEDULED', at(-1, 10)), // passed, sweep not run yet
    booking('cancel', 'CANCELED', at(2, 10)),
    booking('rejected', 'REJECTED', at(3, 10)),
  ];
  const g = groupBookings(list);
  expect(g.upcoming.map(b => b.id)).toEqual(['next', 'later']);
  expect(g.past.map(b => b.id).sort()).toEqual(['done', 'overdue']);
  expect(g.cancelled.map(b => b.id).sort()).toEqual(['cancel', 'rejected']);
  expect(tabOf(booking('x', 'MISSED', at(1, 10)))).toBe('past');
  expect(canCancel(booking('x', 'PENDING', at(1, 10)))).toBe(true);
  expect(canCancel(booking('x', 'COMPLETED', at(1, 10)))).toBe(false);
  expect(relativeDayBadge(booking('x', 'SCHEDULED', at(1, 10)))).toBe('Tomorrow');
});

// ---------------------------------------------------------------- screen

let data: BookingDetailResponse[] = [];
const cancelled: string[] = [];

beforeEach(() => {
  cancelled.length = 0;
  data = [
    booking('next', 'SCHEDULED', at(1, 15)),
    booking('later', 'PENDING', at(6, 11, 30)),
    booking('done', 'COMPLETED', at(-3, 10), { clientReviewRating: 5 }),
    booking('gone', 'REJECTED', at(2, 10)),
  ];
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    const cancelMatch = url.match(/\/api\/bookings\/([^/]+)\/cancel$/);
    if (cancelMatch && init?.method === 'POST') {
      cancelled.push(cancelMatch[1]);
      const b = data.find(x => x.id === cancelMatch[1])!;
      b.status = 'CANCELED';
      return { ok: true, status: 200, text: async () => JSON.stringify(b) } as Response;
    }
    const body = url.includes('/api/bookings?scope=as-client') ? data : [];
    return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
  }) as unknown as typeof fetch;
});

let client: QueryClient | undefined;
afterEach(() => client?.clear());

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const flush = () => act(async () => new Promise<void>(resolve => setTimeout(() => resolve(), 20)));

async function render(props: Partial<React.ComponentProps<typeof BookingsScreen>> = {}) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client!}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={metrics}>
            <BookingsScreen onOpenMaster={jest.fn()} onFindMaster={jest.fn()} {...props} />
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );
  });
  await flush();
  return tree;
}

/** Flattens nested <Text> children ("Upcoming " + <Text>(2)</Text> → "Upcoming (2)"). */
const flatten = (children: unknown): string =>
  [children]
    .flat(Infinity)
    .map(c =>
      typeof c === 'string' || typeof c === 'number'
        ? String(c)
        : c && typeof c === 'object' && 'props' in c
          ? flatten((c as { props: { children?: unknown } }).props.children)
          : '',
    )
    .join('');

const texts = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAllByType(Text)
    .map(n => flatten(n.props.children))
    .join('\n');

const pressByText = async (tree: ReactTestRenderer.ReactTestRenderer, text: string) => {
  const node = tree.root
    .findAll(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => t.props.children === text))
    .pop();
  expect(node).toBeDefined();
  await act(async () => node!.props.onPress());
};

test('upcoming tab: counts, next appointment hero, later list, no design-only blocks', async () => {
  const tree = await render();
  const all = texts(tree);
  expect(all).toContain('Upcoming (2)');
  expect(all).toContain('Past (1)');
  expect(all).toContain('Cancelled (1)');
  expect(all).toContain('Next appointment');
  expect(all).toContain('Tomorrow');
  expect(all).toContain('Master next');
  expect(all).toContain('Confirmed');
  expect(all).toContain('Awaiting confirmation'); // PENDING later booking
  expect(all).toContain('Khreshchatyk St 1, Kyiv');
  expect(all).not.toMatch(/Reschedule|Deposit|Live Sync/);
  await act(async () => tree.unmount());
});

test('cancel asks for confirmation, then cancels and moves the booking', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    buttons?.find(b => b.style === 'destructive')?.onPress?.();
  });
  const tree = await render();
  await pressByText(tree, 'Cancel Reservation');
  await flush();
  await flush();
  expect(cancelled).toEqual(['next']);
  expect(texts(tree)).toContain('Cancelled (2)');
  alert.mockRestore();
  await act(async () => tree.unmount());
});

test('Get Directions opens Google Maps to the address', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
  const tree = await render();
  await pressByText(tree, 'Get Directions');
  await flush();
  expect(open).toHaveBeenCalledWith(
    'https://www.google.com/maps/dir/?api=1&destination=Khreshchatyk%20St%201%2C%20Kyiv&travelmode=driving',
  );
  open.mockRestore();
  canOpen.mockRestore();
  await act(async () => tree.unmount());
});

test('past and cancelled tabs', async () => {
  const tree = await render();
  await act(async () =>
    tree.root.findAll(n => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function')[1].props.onPress(),
  );
  let all = texts(tree);
  expect(all).toContain('Master done');
  expect(all).toContain('Completed');
  expect(all).toContain('Your rating');
  // Past bookings can't be cancelled.
  expect(all.split('\n')).not.toContain('Cancel');

  await act(async () =>
    tree.root.findAll(n => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function')[2].props.onPress(),
  );
  all = texts(tree);
  expect(all).toContain('Master gone');
  expect(all).toContain('Declined by master');
  await act(async () => tree.unmount());
});

import React from 'react';
import { Alert, Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { AvailabilityDayDto, MasterDetailDto } from '../src/api';
import { BookingScreen } from '../src/features/booking/BookingScreen';
import { buildWeeks, groupByPeriod, validStarts } from '../src/features/booking/bookingSlots';
import { ThemeProvider } from '../src/theme';

// ---------------------------------------------------------------- slot maths

test('validStarts needs enough contiguous free 30-min slots', () => {
  const slots = [
    { time: '10:00', available: true },
    { time: '10:30', available: true },
    { time: '11:00', available: false }, // taken
    { time: '11:30', available: true },
    { time: '12:00', available: true },
    { time: '14:00', available: true }, // gap before it
    { time: '14:30', available: true },
  ];
  expect([...validStarts(slots, 30)]).toEqual(['10:00', '10:30', '11:30', '12:00', '14:00', '14:30']);
  // 60 min = 2 slots: 10:30 runs into the taken 11:00; 12:00 → 14:00 is not contiguous.
  expect([...validStarts(slots, 60)]).toEqual(['10:00', '11:30', '14:00']);
  expect([...validStarts(slots, 90)]).toEqual([]);
});

test('groupByPeriod / buildWeeks', () => {
  const groups = groupByPeriod([
    { time: '09:00', available: true },
    { time: '12:30', available: true },
    { time: '18:00', available: true },
  ]);
  expect(groups.map(g => g.period)).toEqual(['Morning', 'Afternoon', 'Evening']);

  const now = new Date(2026, 10, 11); // Wed 11 Nov 2026
  const weeks = buildWeeks([{ date: '2026-11-24', slots: [] }], now);
  expect(weeks[0][0]).toBe('2026-11-09'); // Monday of the current week
  expect(weeks).toHaveLength(3);
  expect(weeks[2]).toContain('2026-11-24');
});

// ---------------------------------------------------------------- screen

const pad = (n: number) => String(n).padStart(2, '0');
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const DAY = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

const master: MasterDetailDto = {
  id: 7,
  displayName: 'Elena Rostova',
  username: 'elena',
  title: { en: 'Hair' },
  category: { en: 'Hair' },
  rating: 4.9,
  reviewCount: 3,
  distanceMeters: null,
  avatarUrl: null,
  verified: true,
  bio: null,
  portfolio: [],
  services: [
    { id: 'offer-short', name: { en: 'Gloss' }, group: { en: 'Hair' }, durationMinutes: 30, price: 950 },
    { id: 'offer-long', name: { en: 'Balayage' }, group: { en: 'Hair' }, durationMinutes: 60, price: 2400 },
  ],
  reviews: [],
};

const availability: AvailabilityDayDto[] = [
  {
    date: DAY,
    slots: [
      { time: '10:00', available: false },
      { time: '15:00', available: true },
      { time: '15:30', available: true },
      { time: '18:00', available: true },
    ],
  },
];

let createStatus = 201;
const posted: unknown[] = [];

beforeEach(() => {
  createStatus = 201;
  posted.length = 0;
  globalThis.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/bookings') && init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      posted.push(body);
      const response =
        createStatus === 201
          ? {
              id: 'b1',
              masterId: 7,
              masterName: 'Elena Rostova',
              serviceName: { en: 'Balayage' },
              price: 2400,
              durationMinutes: 60,
              scheduledTime: body.scheduledTime,
              status: 'PENDING',
            }
          : { message: 'Slot already booked' };
      return { ok: createStatus < 300, status: createStatus, text: async () => JSON.stringify(response) } as Response;
    }
    const body = url.endsWith('/api/masters/7') ? master : url.endsWith('/availability') ? availability : [];
    return { ok: true, status: 200, text: async () => JSON.stringify(body) } as Response;
  }) as unknown as typeof fetch;
});

let client: QueryClient;
afterEach(() => client?.clear());

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const flush = () => act(async () => new Promise<void>(resolve => setTimeout(() => resolve(), 20)));

async function render(onOpenBookings = jest.fn()) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={metrics}>
            <BookingScreen masterId={7} initialServiceId="offer-long" onBack={jest.fn()} onOpenBookings={onOpenBookings} />
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

const timeChip = (tree: ReactTestRenderer.ReactTestRenderer, time: string) =>
  tree.root.findAll(n => n.props.accessibilityLabel === time && typeof n.props.onPress === 'function')[0];

const confirmButton = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAll(
    n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => t.props.children === 'Confirm booking'),
  )[0];

test('shows the preselected service and only start times that fit its duration', async () => {
  const tree = await render();
  const all = texts(tree).join('\n');
  expect(all).toContain('Elena Rostova');
  expect(all).toContain('Balayage');
  expect(all).toContain('Pick a time');
  // Design-only blocks are absent.
  expect(all).not.toMatch(/Payment|Deposit|Tax|Special Requests/);

  // 60 min: 15:00 fits (15:00 + 15:30), 15:30 and 18:00 don't, 10:00 is taken.
  expect(timeChip(tree, '15:00').props.disabled).toBe(false);
  expect(timeChip(tree, '15:30').props.disabled).toBe(true);
  expect(timeChip(tree, '18:00').props.disabled).toBe(true);
  expect(timeChip(tree, '10:00').props.disabled).toBe(true);
  await act(async () => tree.unmount());
});

test('confirming posts the booking and shows the request-sent state', async () => {
  const onOpenBookings = jest.fn();
  const tree = await render(onOpenBookings);

  await act(async () => timeChip(tree, '15:00').props.onPress());
  await act(async () => confirmButton(tree).props.onPress());
  await flush();

  expect(posted).toEqual([{ masterId: 7, offerId: 'offer-long', scheduledTime: `${DAY}T15:00:00` }]);
  const all = texts(tree).join('\n');
  expect(all).toContain('Booking request sent');
  expect(all).toContain('2 400 ₴'.replace(' ', ' '));

  const myBookings = tree.root.findAll(
    n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => t.props.children === 'My bookings'),
  )[0];
  await act(async () => myBookings.props.onPress());
  expect(onOpenBookings).toHaveBeenCalled();
  await act(async () => tree.unmount());
});

test('a taken slot (409) clears the time and explains why', async () => {
  createStatus = 409;
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const tree = await render();

  await act(async () => timeChip(tree, '15:00').props.onPress());
  await act(async () => confirmButton(tree).props.onPress());
  await flush();

  expect(alert).toHaveBeenCalledWith('Booking failed', 'This time was just taken. Please pick another one.');
  expect(texts(tree)).toContain('Pick a time');
  alert.mockRestore();
  await act(async () => tree.unmount());
});

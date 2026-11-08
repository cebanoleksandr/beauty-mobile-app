import React from 'react';
import { Alert } from 'react-native';
import type { BookingDetailResponse, BookingStatus, OfferResponse } from '../src/api';
import { MasterBookingsScreen, masterTabOf } from '../src/features/master/bookings/MasterBookingsScreen';
import { MasterCalendarScreen } from '../src/features/master/calendar/MasterCalendarScreen';
import { filterClients, summarizeClients } from '../src/features/master/clients/clientSummary';
import { MasterServicesScreen } from '../src/features/master/services/MasterServicesScreen';
import { BecomeMasterScreen } from '../src/features/master/onboarding/BecomeMasterScreen';
import { at, clearClient, flush, press, pressLabel, renderScreen, stubFetch, texts } from '../test-utils/screen';

afterEach(clearClient);

const booking = (
  id: string,
  status: BookingStatus,
  scheduledTime: string,
  extra: Partial<BookingDetailResponse> = {},
) =>
  ({
    id,
    masterId: 7,
    masterName: 'Me',
    masterAvatarUrl: null,
    masterUsername: null,
    masterAverageRating: null,
    clientId: 100,
    clientName: `Client ${id}`,
    clientAvatarUrl: null,
    clientAverageRating: 4.5,
    offerId: 'o1',
    serviceName: { en: `Service ${id}` },
    price: 500,
    durationMinutes: 60,
    servicePointAddress: null,
    scheduledTime,
    status,
    clientReviewRating: null,
    clientReviewText: null,
    masterReviewRating: null,
    masterReviewText: null,
    ...extra,
  } as BookingDetailResponse);

// ---------------------------------------------------------------- pure helpers

test('client summary: completed visits only, loyal / new, sorting', () => {
  const list = [
    ...Array.from({ length: 5 }, (_, i) =>
      booking(`a${i}`, 'COMPLETED', at(-i - 1, 10), {
        clientId: 1,
        clientName: 'Anna',
      }),
    ),
    booking('b', 'COMPLETED', at(-10, 10), {
      clientId: 2,
      clientName: 'Bob',
      price: 5000,
    }),
    booking('c', 'CANCELED', at(-2, 10), { clientId: 3, clientName: 'Cid' }),
  ];
  const clients = summarizeClients(list);
  expect(clients.map(c => c.name).sort()).toEqual(['Anna', 'Bob']);
  expect(filterClients(clients, '', 'loyal', 'recent').map(c => c.name)).toEqual(['Anna']);
  expect(filterClients(clients, '', 'new', 'recent').map(c => c.name)).toEqual(['Bob']);
  expect(filterClients(clients, '', 'all', 'revenue')[0].name).toBe('Bob');
  expect(filterClients(clients, 'ann', 'all', 'recent').map(c => c.name)).toEqual(['Anna']);
  expect(clients.find(c => c.name === 'Anna')!.history[0].id).toBe('a0');
});

test('master tabs: pending ahead → requests, scheduled ahead → upcoming, the rest → history', () => {
  expect(masterTabOf(booking('x', 'PENDING', at(1, 10)))).toBe('requests');
  expect(masterTabOf(booking('x', 'SCHEDULED', at(1, 10)))).toBe('upcoming');
  expect(masterTabOf(booking('x', 'SCHEDULED', at(-1, 10)))).toBe('history');
  expect(masterTabOf(booking('x', 'COMPLETED', at(-1, 10)))).toBe('history');
});

// ---------------------------------------------------------------- bookings

test('master bookings: approve a request; a 409 explains the overlap', async () => {
  let approveStatus = 200;
  const data = [booking('p1', 'PENDING', at(1, 10)), booking('s1', 'SCHEDULED', at(2, 12))];
  const requests = stubFetch(({ url, method }) => {
    if (url.includes('/approve') && method === 'POST') {
      return approveStatus === 200
        ? { body: { ...data[0], status: 'SCHEDULED' } }
        : {
            status: 409,
            body: { message: 'conflict', conflictingBookingIds: ['s1'] },
          };
    }
    if (url.includes('scope=as-master')) return { body: data };
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const tree = await renderScreen(<MasterBookingsScreen />);
  expect(texts(tree)).toContain('Requests (1)');
  expect(texts(tree)).toContain('Client p1');
  expect(texts(tree)).toContain('New request');

  await press(tree, 'Approve');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/bookings/p1/approve'),
    }),
  );

  approveStatus = 409;
  await press(tree, 'Approve');
  await flush();
  expect(alert).toHaveBeenCalledWith('Could not approve', expect.stringContaining('overlaps'));
  alert.mockRestore();
});

test('master bookings: history lets the master rate the client', async () => {
  stubFetch(({ url }) =>
    url.includes('scope=as-master') ? { body: [booking('d1', 'COMPLETED', at(-1, 10))] } : undefined,
  );
  const tree = await renderScreen(<MasterBookingsScreen />);
  await press(tree, 'History');
  expect(texts(tree)).toContain('Client d1');
  await press(tree, 'Rate client');
  expect(texts(tree)).toContain('Rate your client');
});

// ---------------------------------------------------------------- calendar

test('calendar: shows visits and free slots; closing a slot PATCHes it; add free time POSTs', async () => {
  const day = at(0, 0).slice(0, 10);
  const requests = stubFetch(({ url, method, body }) => {
    if (url.includes('scope=as-master')) return { body: [booking('v1', 'SCHEDULED', at(0, 23, 0))] };
    if (url.endsWith('/api/v1/master/slots') && method === 'GET') {
      return {
        body: [
          {
            id: 's1',
            startTime: `${day}T23:30:00`,
            occupied: false,
            disabled: false,
          },
          {
            id: 's2',
            startTime: `${day}T23:00:00`,
            occupied: true,
            disabled: false,
          },
        ],
      };
    }
    if (url.includes('/api/v1/master/slots/s1') && method === 'PATCH') {
      return {
        body: {
          id: 's1',
          startTime: `${day}T23:30:00`,
          occupied: false,
          disabled: body.disabled,
        },
      };
    }
    if (url.endsWith('/api/v1/master/slots') && method === 'POST') return { body: [] };
  });
  const tree = await renderScreen(<MasterCalendarScreen />);
  const all = texts(tree);
  expect(all).toContain('Client v1');
  expect(all).toContain('Free slots · 1 open');

  await pressLabel(tree, '23:30 open');
  await flush();
  expect(requests).toContainEqual(expect.objectContaining({ method: 'PATCH', body: { disabled: true } }));

  await pressLabel(tree, 'Add free time');
  await press(tree, 'Open 18 slots');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      body: { date: day, startHour: 9, endHour: 18 },
    }),
  );
});

// ---------------------------------------------------------------- services

const offer: OfferResponse = {
  id: 'o1',
  serviceDefinitionId: 'd1',
  serviceName: { en: 'Haircut' },
  categoryId: 'c1',
  categoryName: { en: 'Hair' },
  price: 600,
  durationMinutes: 60,
  description: null,
  available: true,
  servicePoint: { id: 'sp1', address: 'Main St 1', lat: 50, lng: 30 },
};

test('services: grouped by category; delete asks first; edit PUTs price', async () => {
  const requests = stubFetch(({ url, method }) => {
    if (url.endsWith('/api/v1/master/offers') && method === 'GET') return { body: [offer] };
    if (url.endsWith('/api/v1/master/service-points')) return { body: [offer.servicePoint] };
    if (url.endsWith('/api/catalog'))
      return {
        body: [
          {
            id: 'c1',
            name: { en: 'Hair' },
            definitions: [{ id: 'd1', name: { en: 'Haircut' } }],
          },
        ],
      };
    if (url.includes('/offers/o1')) return { status: method === 'DELETE' ? 204 : 200, body: offer };
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    buttons?.find(b => b.style === 'destructive')?.onPress?.();
  });
  const tree = await renderScreen(<MasterServicesScreen />);
  const all = texts(tree);
  expect(all).toContain('Hair');
  expect(all).toContain('Haircut');
  expect(all).toContain('600 ₴');

  await pressLabel(tree, 'Delete Haircut');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'DELETE',
      url: expect.stringContaining('/offers/o1'),
    }),
  );

  await pressLabel(tree, 'Edit Haircut');
  const price = tree.root.findAll(
    n => n.props.accessibilityLabel === 'Price' && typeof n.props.onChangeText === 'function',
  )[0];
  const { act } = require('react-test-renderer');
  await act(async () => price.props.onChangeText('750'));
  await press(tree, 'Save changes');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'PUT',
      url: expect.stringContaining('/offers/o1'),
      body: expect.objectContaining({
        price: 750,
        durationMinutes: 60,
        servicePointId: 'sp1',
      }),
    }),
  );
  alert.mockRestore();
});

// ---------------------------------------------------------------- onboarding

test('become a master: add a service from the catalog and submit the onboarding', async () => {
  const requests = stubFetch(({ url }) => {
    if (url.endsWith('/api/catalog'))
      return {
        body: [
          {
            id: 'c1',
            name: { en: 'Hair' },
            definitions: [{ id: 'd1', name: { en: 'Haircut' } }],
          },
        ],
      };
    if (url.endsWith('/api/v1/master/onboarding')) return { body: { success: true, role: 'MASTER' } };
  });
  const onDone = jest.fn();
  const tree = await renderScreen(<BecomeMasterScreen onBack={jest.fn()} onDone={onDone} />);
  expect(texts(tree)).toContain('No services added');

  const { act } = require('react-test-renderer');
  await press(tree, 'Add a service');
  await pressLabel(tree, 'Category');
  await press(tree, 'Hair');
  await pressLabel(tree, 'Service');
  await press(tree, 'Haircut');
  const price = tree.root.findAll(
    n => n.props.accessibilityLabel === 'Price' && typeof n.props.onChangeText === 'function',
  )[0];
  await act(async () => price.props.onChangeText('500'));
  await press(tree, '1 h');
  await press(tree, 'Save service');
  expect(texts(tree)).toContain('Haircut');

  await press(tree, 'Become a master · 1 service');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/api/v1/master/onboarding'),
      body: {
        services: [{ service_id: 'd1', price: 500, duration_minutes: 60 }],
      },
    }),
  );
  expect(texts(tree)).toContain("You're a master now!");
  await press(tree, 'Go to my workspace');
  expect(onDone).toHaveBeenCalled();
});

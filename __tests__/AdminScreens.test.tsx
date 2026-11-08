import React from 'react';
import { Alert } from 'react-native';
import { act } from 'react-test-renderer';
import type { AdminStatsResponse } from '../src/api';
import { AdminReportsScreen } from '../src/features/admin/AdminReportsScreen';
import { AdminRequestsScreen } from '../src/features/admin/AdminRequestsScreen';
import { AdminStatsScreen, auditSummary } from '../src/features/admin/AdminStatsScreen';
import { AdminUsersScreen } from '../src/features/admin/AdminUsersScreen';
import { clearClient, flush, press, renderScreen, stubFetch, texts } from '../test-utils/screen';

afterEach(clearClient);

const catalog = [{ id: 'c1', name: { en: 'Hair' }, definitions: [] }];

test('requests: consider lets the admin fix the name, then approves', async () => {
  const requests = stubFetch(({ url }) => {
    if (url.includes('/api/admin/catalog-requests?status=PENDING')) {
      return {
        body: [
          {
            id: 'r1',
            requesterId: 5,
            requesterName: 'Olena',
            kind: 'SERVICE',
            proposedName: 'lash lift',
            categoryId: 'c1',
            categoryName: { en: 'Hair' },
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
    if (url.endsWith('/api/catalog')) return { body: catalog };
    if (url.includes('/approve')) return { body: {} };
  });
  const tree = await renderScreen(<AdminRequestsScreen />);
  expect(texts(tree)).toContain('lash lift');
  expect(texts(tree)).toContain('From Olena • just now');

  await press(tree, 'Consider');
  const input = tree.root.findAll(
    n => n.props.accessibilityLabel === 'Name' && typeof n.props.onChangeText === 'function',
  )[0];
  expect(input.props.value).toBe('lash lift');
  await act(async () => input.props.onChangeText('Lash lift '));
  await press(tree, 'Approve & add to catalog');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/catalog-requests/r1/approve'),
      body: { name: 'Lash lift', categoryId: 'c1' },
    }),
  );
});

test('reports: resolve an open report', async () => {
  const requests = stubFetch(({ url }) => {
    if (url.includes('/api/admin/reports?status=OPEN')) {
      return {
        body: [
          {
            id: 'rep1',
            bookingId: 'b1',
            reporterId: 1,
            reporterName: 'Ann',
            reportedUserId: 2,
            reportedUserName: 'Bob',
            message: 'Was late by an hour',
            status: 'OPEN',
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
    if (url.includes('/resolve')) return { body: {} };
  });
  const tree = await renderScreen(<AdminReportsScreen />);
  expect(texts(tree)).toContain('Was late by an hour');
  expect(texts(tree)).toContain('Ann reported Bob');
  await press(tree, 'Mark as resolved');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/reports/rep1/resolve'),
    }),
  );
});

const stats: AdminStatsResponse = {
  periodDays: 30,
  from: '2026-10-09',
  users: {
    total: 120,
    newInPeriod: 14,
    masters: 9,
    activeDay: 5,
    activeWeek: 30,
    activeMonth: 70,
  },
  bookings: {
    created: 40,
    approved: 30,
    rejectedByMaster: 10,
    autoRejected: 2,
    canceled: 3,
    completed: 18,
    missed: 2,
    medianResponseMinutes: 42,
  },
  dailyBookings: [
    { date: '2026-11-07', count: 3 },
    { date: '2026-11-08', count: 0 },
  ],
  topCategories: [{ id: 'c1', name: { en: 'Hair' }, bookings: 12 }],
  topMasters: [{ id: 7, name: 'Elena', completed: 8, rating: 4.9 }],
  moderation: { openReports: 1, pendingCatalogRequests: 2, bansInPeriod: 0 },
};

test('stats: tiles, rates, top lists; switching the period refetches', async () => {
  const requests = stubFetch(({ url }) => {
    if (url.includes('/api/admin/stats')) return { body: stats };
    if (url.includes('/api/admin/audit-log')) {
      return {
        body: [
          {
            id: 'a1',
            actorId: 1,
            actorName: 'Root',
            action: 'USER_BANNED',
            targetType: 'USER',
            targetId: '55',
            details: { reason: 'spam' },
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }
  });
  const tree = await renderScreen(<AdminStatsScreen />);
  const all = texts(tree);
  expect(all).toContain('120');
  expect(all).toContain('75%'); // 30 / (30 + 10)
  expect(all).toContain('10%'); // 2 / (18 + 2)
  expect(all).toContain('42 min');
  expect(all).toContain('Elena');
  expect(all).toContain('Banned user #55 • spam');

  await press(tree, '7 days');
  await flush();
  expect(requests.some(r => r.url.includes('/api/admin/stats?days=7'))).toBe(true);
});

test('audit summary covers catalog renames', () => {
  expect(
    auditSummary({
      id: 'x',
      actorId: 1,
      actorName: null,
      action: 'CATALOG_REQUEST_APPROVED',
      targetType: 'CATALOG_REQUEST',
      targetId: 'r1',
      details: { requestedName: 'lash', finalName: 'Lash lift' },
      createdAt: '',
    }),
  ).toBe('Approved request • lash → Lash lift');
});

test('users: ban with a reason, grant admin after confirmation', async () => {
  const requests = stubFetch(({ url, method }) => {
    if (url.includes('/api/user/me')) return { body: { id: 1, isAdmin: true, context: 'ADMIN' } };
    if (url.endsWith('/api/admin/users/admins'))
      return {
        body: [{ id: 1, firstName: 'Root', isAdmin: true, isBanned: false }],
      };
    if (url.includes('/api/admin/users') && method === 'GET') {
      return {
        body: [
          {
            id: 9,
            username: 'spammer',
            firstName: 'Sam',
            lastName: null,
            isAdmin: false,
            isBanned: false,
            bannedReason: null,
          },
        ],
      };
    }
    return { body: {} };
  });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
    buttons?.find(b => b.style !== 'cancel')?.onPress?.();
  });
  const tree = await renderScreen(<AdminUsersScreen />);
  expect(texts(tree)).toContain('Root (you)');
  expect(texts(tree)).toContain('Sam');

  await press(tree, 'Ban');
  const reason = tree.root.findAll(
    n => typeof n.props.onChangeText === 'function' && n.props.placeholder?.startsWith('Reason'),
  )[0];
  await act(async () => reason.props.onChangeText('spam links'));
  await press(tree, 'Ban user', 0);
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/users/9/ban'),
      body: { reason: 'spam links' },
    }),
  );

  await press(tree, 'Make admin');
  await flush();
  expect(requests).toContainEqual(
    expect.objectContaining({
      method: 'POST',
      url: expect.stringContaining('/users/9/admin'),
    }),
  );
  alert.mockRestore();
});

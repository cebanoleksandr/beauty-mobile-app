/**
 * Master → Bookings (`GET /api/bookings?scope=as-master`): new requests to
 * approve / decline, upcoming confirmed visits (reschedule, no-show), and
 * history (rate the client). Web counterpart: master/bookings.
 */
import { CalendarX2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { getBookingConflict, type BookingDetailResponse } from '../../../api';
import { useApproveBooking, useBookings, useMarkBookingMissed, useRejectBooking } from '../../../query';
import { EmptyState, ErrorState, LoadingState, PageTitle, SectionTitle, Segmented } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';
import { endOf } from '../../bookings/bookingGroups';
import { TabScreen } from '../../common/TabScreen';
import { RatingSheet } from '../../reviews/RatingSheet';
import { ClientSheet } from '../components/ClientSheet';
import { MasterBookingCard } from '../components/MasterBookingCard';
import { RescheduleSheet } from '../components/RescheduleSheet';
import { dayHeader, groupByDay } from '../masterDates';

type Tab = 'requests' | 'upcoming' | 'history';

export function masterTabOf(b: BookingDetailResponse, now = new Date()): Tab {
  if (b.status === 'PENDING') return endOf(b) < now ? 'history' : 'requests';
  if (b.status === 'SCHEDULED') return endOf(b) < now ? 'history' : 'upcoming';
  return 'history';
}

export function MasterBookingsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const bookings = useBookings('as-master');
  const approve = useApproveBooking();
  const reject = useRejectBooking();
  const markMissed = useMarkBookingMissed();
  const [tab, setTab] = useState<Tab>('requests');
  const [clientId, setClientId] = useState<number | null>(null);
  const [rating, setRating] = useState<BookingDetailResponse | null>(null);
  const [moving, setMoving] = useState<BookingDetailResponse | null>(null);

  const byTab = useMemo(() => {
    const now = new Date();
    const groups: Record<Tab, BookingDetailResponse[]> = {
      requests: [],
      upcoming: [],
      history: [],
    };
    for (const b of bookings.data ?? []) groups[masterTabOf(b, now)].push(b);
    return groups;
  }, [bookings.data]);

  const days = useMemo(() => groupByDay(byTab[tab], b => b.scheduledTime, tab === 'history'), [byTab, tab]);
  const busy = approve.isPending || reject.isPending || markMissed.isPending;

  const onApprove = (b: BookingDetailResponse) =>
    approve.mutate(b.id, {
      onError: e =>
        Alert.alert(
          t('master.bookings.approveError'),
          getBookingConflict(e) ? t('master.bookings.approveOverlap') : t('common.pleaseTryAgain'),
        ),
    });

  const onReject = (b: BookingDetailResponse) =>
    Alert.alert(t('master.bookings.declineTitle'), t('master.bookings.declineText', { name: b.clientName }), [
      { text: t('common.keep'), style: 'cancel' },
      {
        text: t('master.booking.decline'),
        style: 'destructive',
        onPress: () =>
          reject.mutate(b.id, {
            onError: () => Alert.alert(t('master.bookings.declineError'), t('common.pleaseTryAgain')),
          }),
      },
    ]);

  const onMarkMissed = (b: BookingDetailResponse) =>
    Alert.alert(t('master.bookings.noShowTitle'), t('master.bookings.noShowText', { name: b.clientName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('master.bookings.noShowConfirm'),
        style: 'destructive',
        onPress: () =>
          markMissed.mutate(b.id, {
            onError: () => Alert.alert(t('master.bookings.updateError'), t('common.pleaseTryAgain')),
          }),
      },
    ]);

  return (
    <TabScreen
      refreshing={bookings.isRefetching}
      onRefresh={() => {
        bookings.refetch();
      }}
    >
      <PageTitle title={t('master.bookings.title')} subtitle={t('master.bookings.subtitle')} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'requests', label: t('master.bookings.tabs.requests', { count: byTab.requests.length }) },
          { key: 'upcoming', label: t('master.bookings.tabs.upcoming', { count: byTab.upcoming.length }) },
          { key: 'history', label: t('master.bookings.tabs.history') },
        ]}
      />

      {bookings.isPending ? (
        <LoadingState />
      ) : bookings.isError ? (
        <ErrorState text={t('master.bookings.loadError')} onRetry={() => bookings.refetch()} />
      ) : days.length === 0 ? (
        <EmptyState Icon={CalendarX2} title={t(`master.bookings.empty.${tab}`)} text={t('master.bookings.emptyText')} />
      ) : (
        days.map(([key, items]) => (
          <View key={key} style={styles.day}>
            <SectionTitle>{dayHeader(key)}</SectionTitle>
            {items.map(b => (
              <MasterBookingCard
                key={b.id}
                booking={b}
                busy={busy}
                onOpenClient={setClientId}
                onApprove={onApprove}
                onReject={onReject}
                onMarkMissed={onMarkMissed}
                onReschedule={setMoving}
                onRate={setRating}
              />
            ))}
          </View>
        ))
      )}

      <ClientSheet clientId={clientId} onClose={() => setClientId(null)} />
      <RatingSheet booking={rating} target="client" onClose={() => setRating(null)} />
      <RescheduleSheet booking={moving} onClose={() => setMoving(null)} />
    </TabScreen>
  );
}

const useStyles = makeStyles(t => ({
  day: { gap: t.spacing.md },
}));

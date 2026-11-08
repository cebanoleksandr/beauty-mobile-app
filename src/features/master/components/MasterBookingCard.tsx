/**
 * A booking as the master sees it: client, service, time, price, status and
 * the actions the backend allows the master — approve / decline a request,
 * mark a started visit as a no-show, reschedule a confirmed one (cancelling
 * is client-only on the backend),
 * rate the client after the visit.
 */
import { CalendarClock, Check, Star, UserX, X } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { resolveApiUrl, type BookingDetailResponse } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { formatPrice } from '../../../shared/format';
import { Avatar, Button, Card } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';
import { startOf } from '../../bookings/bookingGroups';
import { StatusPill } from '../../bookings/components/BookingCards';
import { formatDuration } from '../../master-profile/profileFormat';
import { RATEABLE_STATUSES } from '../../reviews/RatingSheet';
import { timeRange } from '../masterDates';

export interface MasterBookingActions {
  onOpenClient: (clientId: number) => void;
  onApprove?: (b: BookingDetailResponse) => void;
  onReject?: (b: BookingDetailResponse) => void;
  onMarkMissed?: (b: BookingDetailResponse) => void;
  onReschedule?: (b: BookingDetailResponse) => void;
  onRate?: (b: BookingDetailResponse) => void;
  busy?: boolean;
}

export function MasterBookingCard({
  booking: b,
  onOpenClient,
  onApprove,
  onReject,
  onMarkMissed,
  onReschedule,
  onRate,
  busy,
  now = new Date(),
}: { booking: BookingDetailResponse; now?: Date } & MasterBookingActions) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tr = useTranslate();
  const pending = b.status === 'PENDING';
  const scheduled = b.status === 'SCHEDULED';
  const started = startOf(b) <= now;
  const faded = b.status === 'CANCELED' || b.status === 'REJECTED';

  return (
    <Card highlight={pending} style={[styles.card, faded && styles.faded]}>
      <View style={styles.top}>
        <Text style={styles.time}>{timeRange(b)}</Text>
        <StatusPill status={b.status} perspective="master" />
      </View>

      <View style={styles.clientRow}>
        <Avatar
          uri={resolveApiUrl(b.clientAvatarUrl)}
          name={b.clientName}
          rating={b.clientAverageRating}
          onPress={() => onOpenClient(b.clientId)}
        />
        <View style={styles.flex}>
          <Text style={[styles.name, faded && styles.strike]} numberOfLines={1}>
            {b.clientName}
          </Text>
          <Text style={styles.service} numberOfLines={1}>
            {tr(b.serviceName)}
          </Text>
          <Text style={styles.meta}>
            {formatDuration(b.durationMinutes)} • {formatPrice(b.price)}
          </Text>
        </View>
      </View>

      {pending && onApprove && onReject && (
        <View style={styles.actions}>
          <Button
            label={t('master.booking.approve')}
            compact
            icon={<Check size={16} color={colors.background} strokeWidth={2.5} />}
            onPress={() => onApprove(b)}
            disabled={busy}
            style={styles.flex}
          />
          <Button
            label={t('master.booking.decline')}
            compact
            variant="danger"
            icon={<X size={16} color="#FB7185" strokeWidth={2.5} />}
            onPress={() => onReject(b)}
            disabled={busy}
            style={styles.flex}
          />
        </View>
      )}

      {scheduled && started && onMarkMissed && (
        <View style={styles.actions}>
          <Button
            label={t('master.booking.noShow')}
            compact
            variant="danger"
            icon={<UserX size={15} color="#FB7185" />}
            onPress={() => onMarkMissed(b)}
            disabled={busy}
            style={styles.flex}
          />
        </View>
      )}

      {scheduled && !started && onReschedule && (
        <View style={styles.actions}>
          <Button
            label={t('master.booking.reschedule')}
            compact
            variant="secondary"
            icon={<CalendarClock size={15} color={colors.text} />}
            onPress={() => onReschedule(b)}
            disabled={busy}
            style={styles.flex}
          />
        </View>
      )}

      {RATEABLE_STATUSES.includes(b.status) && onRate && (
        <View style={styles.actions}>
          <Button
            label={
              b.masterReviewRating !== null ? t('master.booking.editClientRating') : t('master.booking.rateClient')
            }
            compact
            variant="secondary"
            icon={<Star size={15} color="#FBBF24" fill={b.masterReviewRating !== null ? '#FBBF24' : 'transparent'} />}
            onPress={() => onRate(b)}
            style={styles.flex}
          />
        </View>
      )}
    </Card>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  card: { gap: t.spacing.md },
  faded: { opacity: 0.6 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
  },
  time: {
    fontFamily: t.fontFamily.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: t.colors.text,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  name: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  strike: { textDecorationLine: 'line-through', color: t.colors.textSecondary },
  service: { ...t.typography.bodySmall, color: t.colors.textAccent },
  meta: { ...t.typography.bodySmall, color: t.colors.textSecondary },
  actions: { flexDirection: 'row', gap: t.spacing.sm },
}));

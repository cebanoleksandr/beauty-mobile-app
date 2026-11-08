/**
 * Booking cards. Figma: hero "Next appointment" card 7:1276 and compact card
 * 7:1351. Without: verified badge, distance, "Deposit paid" and Reschedule
 * (the backend lets only the master reschedule).
 */
import React from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import CalendarIcon from '../../../assets/icons/bookings/calendar.svg';
import CalendarSmallIcon from '../../../assets/icons/bookings/calendar-small.svg';
import ClockIcon from '../../../assets/icons/bookings/clock.svg';
import DirectionsIcon from '../../../assets/icons/bookings/directions.svg';
import DirectionsSmallIcon from '../../../assets/icons/bookings/directions-small.svg';
import LocationIcon from '../../../assets/icons/bookings/location.svg';
import MessageIcon from '../../../assets/icons/bookings/message.svg';
import MessageSmallIcon from '../../../assets/icons/bookings/message-small.svg';
import StoreIcon from '../../../assets/icons/bookings/store.svg';
import { resolveApiUrl, type BookingDetailResponse } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { formatPrice } from '../../../shared/format';
import { AmbientGlow } from '../../../shared/ui';
import { makeStyles } from '../../../theme';
import { formatDuration } from '../../master-profile/profileFormat';
import { Stars } from '../../master-profile/components/ReviewCard';
import { compactDate, heroDateParts, statusInfo, type StatusTone } from '../bookingGroups';

export interface BookingCardActions {
  onOpenMaster: (b: BookingDetailResponse) => void;
  onDirections?: (b: BookingDetailResponse) => void;
  onCancel?: (b: BookingDetailResponse) => void;
  cancelling?: boolean;
}

function openTelegram(username: string | null) {
  if (username) Linking.openURL(`https://t.me/${username}`);
}

export function StatusPill({ status }: { status: BookingDetailResponse['status'] }) {
  const styles = useStyles();
  const { label, tone } = statusInfo(status);
  return (
    <View style={[styles.pill, styles[`pill_${tone}` as const]]}>
      {(tone === 'success' || tone === 'pending') && <View style={[styles.pillDot, styles[`dot_${tone}` as const]]} />}
      <Text style={[styles.pillText, styles[`pillText_${tone}` as const]]}>{label}</Text>
    </View>
  );
}

function Avatar({ uri, size }: { uri?: string; size: number }) {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size },
        size > 50 ? styles.avatarRingStrong : styles.avatarRing,
      ]}
    >
      {uri && <Image source={{ uri }} style={styles.avatarImage} />}
    </View>
  );
}

export function HeroBookingCard({ booking, onOpenMaster, onDirections, onCancel, cancelling }: { booking: BookingDetailResponse } & BookingCardActions) {
  const styles = useStyles();
  const tr = useTranslate();
  const { day, time } = heroDateParts(booking);

  return (
    <View style={styles.hero}>
      <AmbientGlow size={240} color="rgba(232, 180, 160, 0.1)" style={styles.heroGlow} />

      <View style={styles.heroHeader}>
        <Pressable
          onPress={() => onOpenMaster(booking)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${booking.masterName}'s profile`}
          style={styles.masterRow}
        >
          <Avatar uri={resolveApiUrl(booking.masterAvatarUrl)} size={56} />
          <View style={styles.masterText}>
            <Text style={styles.heroName} numberOfLines={1}>
              {booking.masterName}
            </Text>
            <Text style={styles.service} numberOfLines={1}>
              {tr(booking.serviceName)}
            </Text>
            <View style={styles.metaRow}>
              <StatusPill status={booking.status} />
              <View style={styles.duration}>
                <ClockIcon />
                <Text style={styles.durationText}>{formatDuration(booking.durationMinutes)}</Text>
              </View>
            </View>
          </View>
        </Pressable>
        {!!booking.masterUsername && (
          <Pressable
            onPress={() => openTelegram(booking.masterUsername)}
            accessibilityRole="button"
            accessibilityLabel={`Message ${booking.masterName} in Telegram`}
            style={styles.messageButton}
          >
            <MessageIcon />
          </Pressable>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <CalendarIcon />
          </View>
          <Text style={styles.detailText}>
            {day} • <Text style={styles.detailAccent}>{time}</Text>
          </Text>
        </View>
        {!!booking.servicePointAddress && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <LocationIcon />
            </View>
            <Text style={[styles.detailText, styles.flex]}>{booking.servicePointAddress}</Text>
          </View>
        )}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(booking.price)}</Text>
        </View>
      </View>

      {(onDirections || onCancel) && (
        <View style={styles.heroActions}>
          {onDirections && booking.servicePointAddress && (
            <Pressable
              onPress={() => onDirections(booking)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <DirectionsIcon />
              <Text style={styles.primaryLabel}>Get Directions</Text>
            </Pressable>
          )}
          {onCancel && (
            <Pressable
              onPress={() => onCancel(booking)}
              disabled={cancelling}
              accessibilityRole="button"
              hitSlop={6}
              style={styles.cancelLink}
            >
              <Text style={styles.cancelLinkText}>{cancelling ? 'Cancelling…' : 'Cancel Reservation'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function CompactBookingCard({ booking, onOpenMaster, onDirections, onCancel, cancelling }: { booking: BookingDetailResponse } & BookingCardActions) {
  const styles = useStyles();
  const tr = useTranslate();
  const showActions = (onDirections && booking.servicePointAddress) || onCancel;

  return (
    <View style={styles.compact}>
      <View style={styles.heroHeader}>
        <Pressable
          onPress={() => onOpenMaster(booking)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${booking.masterName}'s profile`}
          style={styles.masterRow}
        >
          <Avatar uri={resolveApiUrl(booking.masterAvatarUrl)} size={48} />
          <View style={[styles.masterText, styles.masterTextCompact]}>
            <Text style={styles.compactName} numberOfLines={1}>
              {booking.masterName}
            </Text>
            <Text style={styles.service} numberOfLines={1}>
              {tr(booking.serviceName)}
            </Text>
            <View style={styles.metaRow}>
              <StatusPill status={booking.status} />
              <Text style={styles.durationMuted}>{formatDuration(booking.durationMinutes)}</Text>
            </View>
          </View>
        </Pressable>
        {!!booking.masterUsername && (
          <Pressable
            onPress={() => openTelegram(booking.masterUsername)}
            accessibilityRole="button"
            accessibilityLabel={`Message ${booking.masterName} in Telegram`}
            style={styles.messageButtonSmall}
          >
            <MessageSmallIcon />
          </Pressable>
        )}
      </View>

      <View style={styles.dateBox}>
        <View style={styles.dateRow}>
          <View style={styles.dateLeft}>
            <CalendarSmallIcon />
            <Text style={styles.dateText}>{compactDate(booking)}</Text>
          </View>
          <Text style={styles.datePrice}>{formatPrice(booking.price)}</Text>
        </View>
        {!!booking.servicePointAddress && (
          <View style={styles.addressRow}>
            <StoreIcon />
            <Text style={styles.addressText} numberOfLines={1}>
              {booking.servicePointAddress}
            </Text>
          </View>
        )}
        {booking.clientReviewRating !== null && (
          <View style={styles.addressRow}>
            <Text style={styles.addressText}>Your rating</Text>
            <Stars rating={booking.clientReviewRating} />
          </View>
        )}
      </View>

      {showActions && (
        <View style={styles.compactActions}>
          {onDirections && booking.servicePointAddress && (
            <Pressable
              onPress={() => onDirections(booking)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
            >
              <DirectionsSmallIcon />
              <Text style={styles.smallButtonText}>Directions</Text>
            </Pressable>
          )}
          {onCancel && (
            <Pressable
              onPress={() => onCancel(booking)}
              disabled={cancelling}
              accessibilityRole="button"
              style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
            >
              <Text style={styles.ghostButtonText}>{cancelling ? 'Cancelling…' : 'Cancel'}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const PILL: Record<StatusTone, { bg: string; border: string; fg: string }> = {
  success: { bg: 'rgba(2, 44, 34, 0.6)', border: 'rgba(16, 185, 129, 0.2)', fg: '#34D399' },
  pending: { bg: 'rgba(80, 40, 174, 0.25)', border: 'rgba(206, 189, 255, 0.25)', fg: '#CEBDFF' },
  muted: { bg: 'rgba(42, 42, 45, 0.6)', border: 'rgba(255, 255, 255, 0.06)', fg: '#9D8D88' },
  danger: { bg: 'rgba(96, 20, 16, 0.4)', border: 'rgba(242, 184, 181, 0.2)', fg: '#F2B8B5' },
};

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  pressed: { opacity: t.opacity.pressed },

  // Status pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 1,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
  },
  pill_success: { backgroundColor: PILL.success.bg, borderColor: PILL.success.border },
  pill_pending: { backgroundColor: PILL.pending.bg, borderColor: PILL.pending.border },
  pill_muted: { backgroundColor: PILL.muted.bg, borderColor: PILL.muted.border },
  pill_danger: { backgroundColor: PILL.danger.bg, borderColor: PILL.danger.border },
  pillDot: { width: 6, height: 6, borderRadius: t.radii.full },
  dot_success: { backgroundColor: PILL.success.fg },
  dot_pending: { backgroundColor: PILL.pending.fg },
  pillText: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 10,
    lineHeight: 20,
  },
  pillText_success: { color: PILL.success.fg },
  pillText_pending: { color: PILL.pending.fg },
  pillText_muted: { color: PILL.muted.fg },
  pillText_danger: { color: PILL.danger.fg },

  // Avatar
  avatar: {
    borderRadius: t.radii.full,
    overflow: 'hidden',
    backgroundColor: t.colors.cardInner,
  },
  avatarRingStrong: { boxShadow: '0px 0px 0px 2px rgba(232, 180, 160, 0.6)' },
  avatarRing: { boxShadow: '0px 0px 0px 1px rgba(232, 180, 160, 0.4)' },
  avatarImage: { width: '100%', height: '100%' },

  // Hero card
  hero: {
    padding: 21,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.card,
    boxShadow: '0px 8px 32px 0px rgba(232, 180, 160, 0.08)',
    overflow: 'hidden',
  },
  heroGlow: { top: -112, right: -112 },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
  },
  masterRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterText: {
    flex: 1,
    paddingLeft: 14,
  },
  masterTextCompact: { paddingLeft: t.spacing.md },
  heroName: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  compactName: {
    fontFamily: t.fontFamily.medium,
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  service: {
    ...t.typography.bodySmall,
    color: t.colors.textAccent,
  },
  metaRow: {
    paddingTop: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  durationText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textAccent,
  },
  durationMuted: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textSecondary,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    marginTop: 17,
    paddingTop: t.spacing.lg,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: t.radii.md,
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontFamily: t.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: '#FFFFFF',
  },
  detailAccent: {
    fontFamily: t.fontFamily.semibold,
    color: t.colors.primary,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(31, 31, 34, 0.6)',
  },
  totalLabel: {
    ...t.typography.bodySmall,
    color: t.colors.textAccent,
  },
  totalValue: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  heroActions: {
    paddingTop: t.spacing.lg,
    gap: t.spacing.md,
    alignItems: 'stretch',
  },
  primaryButton: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 8px 0px rgba(232, 180, 160, 0.2)',
  },
  primaryLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.background,
  },
  cancelLink: {
    alignSelf: 'center',
    paddingVertical: t.spacing.xs,
  },
  cancelLinkText: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textSecondary,
  },

  // Compact card
  compact: {
    gap: t.spacing.lg,
    padding: 17,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: t.colors.card,
  },
  dateBox: {
    gap: 6,
    padding: 13,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(31, 31, 34, 0.4)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  dateText: {
    fontFamily: t.fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#FFFFFF',
  },
  datePrice: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: t.colors.primaryContainer,
  },
  addressRow: {
    paddingTop: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  addressText: {
    flexShrink: 1,
    ...t.typography.bodySmall,
    color: t.colors.textAccent,
  },
  compactActions: {
    flexDirection: 'row',
    gap: t.spacing.sm,
  },
  smallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.xs,
    paddingVertical: 9,
    borderRadius: t.radii.md,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
  },
  smallButtonText: {
    fontFamily: t.fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: '#FFFFFF',
  },
  ghostButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: t.radii.md,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textSecondary,
  },
}));

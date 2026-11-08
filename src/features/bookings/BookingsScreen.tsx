/**
 * My bookings (client). Figma: Masters → node 7:1243, limited to what the
 * backend provides (`GET /api/bookings?scope=as-client`, `POST /{id}/cancel`):
 *
 *  - kept: Upcoming / Past / Cancelled tabs with counts, "Next appointment"
 *    hero, later bookings, status, duration, date & time, address
 *    (+ Google Maps directions), price, Telegram message, cancel,
 *    "book a new treatment" callout;
 *  - added from the web app: rating the master for completed / missed
 *    visits (`POST /api/reviews`, optional complaint for admins);
 *  - dropped: "Atelier concierge", "Live sync" (no realtime client here),
 *    verified badge, distance, deposit, Reschedule (master-only on the backend),
 *    calendar-sync button.
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import SparklesIcon from '../../assets/icons/bookings/sparkles.svg';
import { ApiError, type BookingDetailResponse } from '../../api';
import { useBookings, useCancelBooking } from '../../query';
import { openDirectionsTo } from '../../shared/openDirections';
import { useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';
import { DiscoverHeader } from '../discover/components/DiscoverHeader';
import { canCancel, groupBookings, monthLabel, relativeDayBadge, type BookingTab } from './bookingGroups';
import { RATEABLE_STATUSES, RatingSheet } from '../reviews/RatingSheet';
import { CompactBookingCard, HeroBookingCard, type BookingCardActions } from './components/BookingCards';

interface BookingsScreenProps {
  onOpenMaster: (masterId: number) => void;
  onFindMaster: () => void;
}

const TABS: BookingTab[] = ['upcoming', 'past', 'cancelled'];

export function BookingsScreen({ onOpenMaster, onFindMaster }: BookingsScreenProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const bookings = useBookings('as-client');
  const cancelBooking = useCancelBooking();
  const [tab, setTab] = useState<BookingTab>('upcoming');
  const [ratingFor, setRatingFor] = useState<BookingDetailResponse | null>(null);

  const groups = useMemo(() => groupBookings(bookings.data ?? []), [bookings.data]);
  const list = groups[tab];

  const confirmCancel = (b: BookingDetailResponse) =>
    Alert.alert(t('bookings.cancelTitle'), t('bookings.cancelText', { name: b.masterName }), [
      { text: t('common.keep'), style: 'cancel' },
      {
        text: t('bookings.cancelConfirm'),
        style: 'destructive',
        onPress: () =>
          cancelBooking.mutate(b.id, {
            onError: e =>
              Alert.alert(
                t('bookings.cancelError'),
                e instanceof ApiError && e.isConflict ? t('bookings.cancelTooLate') : t('common.pleaseTryAgain'),
              ),
          }),
      },
    ]);

  const actionsFor = (b: BookingDetailResponse): BookingCardActions => ({
    onOpenMaster: x => onOpenMaster(x.masterId),
    onDirections:
      tab === 'upcoming'
        ? x => {
            if (x.servicePointAddress) openDirectionsTo(x.servicePointAddress).catch(() => {});
          }
        : undefined,
    onCancel: canCancel(b) ? confirmCancel : undefined,
    onRate: RATEABLE_STATUSES.includes(b.status) ? setRatingFor : undefined,
    cancelling: cancelBooking.isPending && cancelBooking.variables === b.id,
  });

  const [next, ...later] = list;

  return (
    <View style={styles.screen}>
      <DiscoverHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={bookings.isRefetching}
            onRefresh={() => {
              bookings.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.title} accessibilityRole="header">
          {t('bookings.title')}
        </Text>

        <View style={styles.segments} accessibilityRole="tablist">
          {TABS.map(key => {
            const active = key === tab;
            return (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                  {t(`bookings.tabs.${key}`)} <Text style={styles.segmentCount}>({groups[key].length})</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {bookings.isPending ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : bookings.isError ? (
          <Pressable onPress={() => bookings.refetch()} accessibilityRole="button" style={styles.loader}>
            <Text style={styles.link}>{t('bookings.loadError')}</Text>
          </Pressable>
        ) : tab === 'upcoming' ? (
          <>
            {next && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionDot} />
                    <Text style={styles.sectionTitle}>{t('bookings.next')}</Text>
                  </View>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{relativeDayBadge(next)}</Text>
                  </View>
                </View>
                <HeroBookingCard booking={next} {...actionsFor(next)} />
              </View>
            )}

            {later.length > 0 && (
              <View style={[styles.section, styles.sectionSpaced]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('bookings.later')}</Text>
                  <Text style={styles.sectionMeta}>{monthLabel(later[0])}</Text>
                </View>
                {later.map(b => (
                  <CompactBookingCard key={b.id} booking={b} {...actionsFor(b)} />
                ))}
              </View>
            )}

            <View style={styles.callout}>
              <View style={styles.calloutIcon}>
                <SparklesIcon />
              </View>
              <Text style={styles.calloutTitle}>{next ? t('bookings.planNext') : t('bookings.noUpcoming')}</Text>
              <Text style={styles.calloutText}>{t('bookings.calloutText')}</Text>
              <Pressable
                onPress={onFindMaster}
                accessibilityRole="button"
                style={({ pressed }) => [styles.calloutButton, pressed && styles.pressed]}
              >
                <Text style={styles.calloutButtonText}>{t('bookings.bookNew')}</Text>
              </Pressable>
            </View>
          </>
        ) : list.length ? (
          <View style={styles.section}>
            {list.map(b => (
              <CompactBookingCard key={b.id} booking={b} {...actionsFor(b)} />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>{tab === 'past' ? t('bookings.noPast') : t('bookings.noCancelled')}</Text>
        )}
      </ScrollView>
      <RatingSheet booking={ratingFor} target="master" onClose={() => setRatingFor(null)} />
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingTop: t.spacing.xxl,
    paddingHorizontal: t.spacing.xl,
    paddingBottom: t.spacing.xxxl,
    gap: t.spacing.xxl,
  },
  pressed: { opacity: t.opacity.pressed },
  title: {
    fontFamily: t.fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: '#FFFFFF',
  },
  segments: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: t.colors.card,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.md,
  },
  segmentActive: {
    backgroundColor: t.colors.buttonNeutral,
    boxShadow: '0px 2px 6px 0px rgba(232, 180, 160, 0.12)',
  },
  segmentLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textAccent,
  },
  segmentLabelActive: { color: t.colors.primary },
  segmentCount: {
    fontSize: 11,
    opacity: 0.7,
  },
  loader: { marginTop: t.spacing.xxl, alignSelf: 'center' },
  link: { ...t.typography.labelLarge, color: t.colors.primary },
  empty: {
    ...t.typography.bodyMedium,
    marginTop: t.spacing.xl,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  section: { gap: t.spacing.md },
  sectionSpaced: { paddingTop: t.spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
  },
  sectionTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    color: t.colors.textAccent,
  },
  sectionMeta: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textSecondary,
  },
  dayBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.2)',
    backgroundColor: 'rgba(232, 180, 160, 0.1)',
  },
  dayBadgeText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.primary,
  },
  callout: {
    alignItems: 'center',
    gap: t.spacing.md,
    paddingTop: 29,
    paddingBottom: 21,
    paddingHorizontal: 21,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundImage: `linear-gradient(to bottom, rgba(42, 42, 45, 0.4) 0%, ${t.colors.card} 100%)`,
  },
  calloutIcon: {
    width: 48,
    height: 48,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.2)',
    backgroundColor: 'rgba(232, 180, 160, 0.1)',
    boxShadow: '0px 0px 24px 0px rgba(232, 180, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  calloutText: {
    ...t.typography.bodySmall,
    maxWidth: 320,
    marginTop: -8,
    textAlign: 'center',
    color: t.colors.textAccent,
  },
  calloutButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: t.spacing.md,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.2)',
  },
  calloutButtonText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.background,
  },
}));

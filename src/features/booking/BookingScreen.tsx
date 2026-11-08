/**
 * Book an appointment. Figma: Masters → node 7:935, limited to what the
 * backend supports — `POST /api/bookings { masterId, offerId, scheduledTime }`
 * against `GET /api/masters/{id}/availability`:
 *
 *  - kept: master summary, selected service (+ change), date strip, time
 *    slots, total (= service price), confirm;
 *  - dropped (no backend data/fields): studio name & address, "recommended"
 *    hint, notes to the master, payment methods, deposit, fees & tax,
 *    cancellation policy.
 *
 * The created booking is PENDING until the master approves it, so the screen
 * says "request" rather than "reserved".
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowRight from '../../assets/icons/booking/arrow-right.svg';
import BackIcon from '../../assets/icons/booking/back.svg';
import InfoIcon from '../../assets/icons/booking/info.svg';
import TimeCheck from '../../assets/icons/booking/time-check.svg';
import { ApiError, NetworkError, type BookingDetailResponse, type MasterServiceDto } from '../../api';
import { useTranslate } from '../../i18n/language';
import { useCreateBooking, useMasterAvailability, useMasterDetail } from '../../query';
import { formatPrice } from '../../shared/format';
import { makeStyles } from '../../theme';
import { ServiceRow } from '../master-profile/components/ServiceRow';
import { formatDuration } from '../master-profile/profileFormat';
import {
  buildWeeks,
  formatAppointment,
  validStarts as computeValidStarts,
} from './bookingSlots';
import { BookingSummaryCard } from './components/BookingSummaryCard';
import { DatePicker } from './components/DatePicker';
import { StepIndicator } from './components/StepIndicator';
import { TimeSlotGrid } from './components/TimeSlotGrid';

interface BookingScreenProps {
  masterId: number;
  /** Offer id picked on the profile; defaults to the master's first service. */
  initialServiceId?: string;
  onBack: () => void;
  onOpenBookings: () => void;
}

function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409 || error.status === 422) return 'This time was just taken. Please pick another one.';
    if (error.status === 400) return error.message || 'This booking is not allowed.';
    if (error.isNotFound) return 'This service is no longer available.';
  }
  if (error instanceof NetworkError) return 'Could not reach the server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

export function BookingScreen({ masterId, initialServiceId, onBack, onOpenBookings }: BookingScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tr = useTranslate();
  const detail = useMasterDetail(masterId);
  const availability = useMasterAvailability(masterId);
  const createBooking = useCreateBooking();

  const master = detail.data;
  const days = useMemo(() => availability.data ?? [], [availability.data]);

  const [serviceId, setServiceId] = useState<string | undefined>(initialServiceId);
  const service: MasterServiceDto | undefined =
    master?.services.find(s => s.id === serviceId) ?? master?.services[0];

  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [booked, setBooked] = useState<BookingDetailResponse | null>(null);

  // Valid start times per day for the selected service.
  const startsByDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!service) return map;
    for (const day of days) {
      const starts = computeValidStarts(day.slots, service.durationMinutes);
      if (starts.size) map.set(day.date, starts);
    }
    return map;
  }, [days, service]);
  const bookableDays = useMemo(() => new Set(startsByDay.keys()), [startsByDay]);

  const weeks = useMemo(() => buildWeeks(days), [days]);
  const [weekIndex, setWeekIndex] = useState(0);

  // Keep the selection valid: default to the first bookable day, drop a time
  // that no longer fits (service changed, availability refreshed).
  useEffect(() => {
    if (!date || !bookableDays.has(date)) {
      const first = [...bookableDays][0] ?? null;
      setDate(first);
      if (first) setWeekIndex(Math.max(0, weeks.findIndex(w => w.includes(first))));
    }
    if (time && date && !startsByDay.get(date)?.has(time)) setTime(null);
  }, [bookableDays, startsByDay, date, time, weeks]);

  const daySlots = days.find(d => d.date === date)?.slots ?? [];
  const step: 2 | 3 = time ? 3 : 2;

  const confirm = () => {
    if (!master || !service || !date || !time) return;
    createBooking.mutate(
      { masterId, offerId: service.id, scheduledTime: `${date}T${time}:00` },
      {
        onSuccess: setBooked,
        onError: error => {
          Alert.alert('Booking failed', bookingErrorMessage(error));
          if (error instanceof ApiError && (error.status === 409 || error.status === 422)) {
            setTime(null);
            availability.refetch();
          }
        },
      },
    );
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.roundButton}>
          <BackIcon />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {booked ? 'Request sent' : 'Book Appointment'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      {!booked && <StepIndicator current={step} />}
    </View>
  );

  if (booked && service) {
    return (
      <View style={styles.screen}>
        {header}
        <ScrollView contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <TimeCheck />
          </View>
          <Text style={styles.successTitle}>Booking request sent</Text>
          <Text style={styles.successText}>
            {booked.masterName} will get a notification and confirm your appointment. You can follow its status in
            Bookings.
          </Text>
          <View style={styles.receipt}>
            <ReceiptRow label="Service" value={tr(booked.serviceName)} />
            <ReceiptRow
              label="When"
              value={formatAppointment(booked.scheduledTime.slice(0, 10), booked.scheduledTime.slice(11, 16), booked.durationMinutes)}
            />
            <ReceiptRow label="Total" value={formatPrice(booked.price)} accent />
          </View>
        </ScrollView>
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Pressable onPress={onBack} accessibilityRole="button" style={[styles.secondaryButton]}>
            <Text style={styles.secondaryLabel}>Back to profile</Text>
          </Pressable>
          <Pressable onPress={onOpenBookings} accessibilityRole="button" style={styles.confirm}>
            <Text style={styles.confirmLabel}>My bookings</Text>
            <ArrowRight />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}

      {!master || !service ? (
        <View style={styles.center}>
          {detail.isError ? (
            <Pressable onPress={() => detail.refetch()} accessibilityRole="button">
              <Text style={styles.link}>Couldn't load. Try again</Text>
            </Pressable>
          ) : master && !service ? (
            <Text style={styles.muted}>This master has not published any services yet.</Text>
          ) : (
            <ActivityIndicator color={styles.link.color} />
          )}
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}>
            <BookingSummaryCard
              master={master}
              service={service}
              onChangeService={master.services.length > 1 ? () => setPickerOpen(true) : undefined}
            />

            {availability.isPending ? (
              <ActivityIndicator color={styles.link.color} />
            ) : availability.isError ? (
              <Pressable onPress={() => availability.refetch()} accessibilityRole="button">
                <Text style={styles.link}>Couldn't load free times. Try again</Text>
              </Pressable>
            ) : bookableDays.size === 0 ? (
              <View style={styles.notice}>
                <Text style={styles.noticeTitle}>No free time in the next two weeks</Text>
                <Text style={styles.noticeText}>
                  {master.displayName} has no open slots that fit {formatDuration(service.durationMinutes)}. Try another
                  service or check back later.
                </Text>
              </View>
            ) : (
              <>
                <DatePicker
                  weeks={weeks}
                  weekIndex={weekIndex}
                  onWeekChange={setWeekIndex}
                  selected={date}
                  bookableDays={bookableDays}
                  onSelect={d => {
                    setDate(d);
                    setTime(null);
                  }}
                />
                <TimeSlotGrid
                  slots={daySlots}
                  validStarts={startsByDay.get(date ?? '') ?? new Set()}
                  selected={time}
                  onSelect={setTime}
                />
              </>
            )}

            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Summary</Text>
              <ReceiptRow label={tr(service.name)} value={formatPrice(service.price)} />
              {date && time && (
                <ReceiptRow label="When" value={formatAppointment(date, time, service.durationMinutes)} muted />
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(service.price)}</Text>
              </View>
              <View style={styles.info}>
                <InfoIcon />
                <Text style={styles.infoText}>
                  The master confirms each request. You'll see the status in Bookings.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View style={styles.dockInfo}>
              <Text style={styles.dockLabel}>Total</Text>
              <Text style={styles.dockPrice}>{formatPrice(service.price)}</Text>
            </View>
            <Pressable
              onPress={confirm}
              disabled={!time || createBooking.isPending}
              accessibilityRole="button"
              accessibilityState={{ disabled: !time, busy: createBooking.isPending }}
              style={[styles.confirm, (!time || createBooking.isPending) && styles.confirmDisabled]}
            >
              {createBooking.isPending ? (
                <ActivityIndicator color={styles.confirmLabel.color} />
              ) : (
                <>
                  <Text style={styles.confirmLabel}>{time ? 'Confirm booking' : 'Pick a time'}</Text>
                  {time && <ArrowRight />}
                </>
              )}
            </Pressable>
          </View>

          <Modal
            visible={pickerOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setPickerOpen(false)}
            statusBarTranslucent
          >
            <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} accessibilityLabel="Close" />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Choose a service</Text>
              <ScrollView contentContainerStyle={styles.sheetList}>
                {master.services.map(s => (
                  <ServiceRow
                    key={s.id}
                    service={s}
                    selected={s.id === service.id}
                    onSelect={picked => {
                      setServiceId(picked.id);
                      setTime(null);
                      setPickerOpen(false);
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

function ReceiptRow({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, muted && styles.rowMuted]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.rowValue, muted && styles.rowMuted, accent && styles.rowAccent]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: t.spacing.xl,
  },
  link: {
    ...t.typography.labelLarge,
    color: t.colors.primary,
  },
  muted: {
    ...t.typography.bodyMedium,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },

  // Header
  header: {
    backgroundColor: 'rgba(14, 14, 17, 0.8)',
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xl,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(81, 68, 63, 0.3)',
    backgroundColor: t.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  headerSpacer: { width: 36 },

  // Content
  content: {
    paddingTop: t.spacing.lg,
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.xxl,
  },
  notice: {
    gap: t.spacing.xs,
    padding: 17,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  noticeTitle: {
    ...t.typography.titleSmall,
    color: t.colors.text,
  },
  noticeText: {
    ...t.typography.bodySmall,
    lineHeight: 19.5,
    color: t.colors.textSecondary,
  },
  breakdown: {
    gap: t.spacing.sm,
    padding: 17,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
  },
  breakdownTitle: {
    marginBottom: t.spacing.xs,
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  rowLabel: {
    flexShrink: 1,
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  rowValue: {
    fontFamily: t.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  rowMuted: {
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.textAccent,
  },
  rowAccent: {
    fontFamily: t.fontFamily.semibold,
    color: t.colors.primary,
  },
  totalRow: {
    marginTop: t.spacing.xs,
    paddingTop: 9,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: t.colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  totalValue: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.primary,
  },
  info: {
    marginTop: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: 13,
    borderRadius: t.radii.md,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: t.colors.background,
  },
  infoText: {
    flex: 1,
    ...t.typography.bodySmall,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },

  // Bottom dock
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.md,
    paddingTop: 14,
    paddingHorizontal: t.spacing.xl,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: t.colors.chrome,
    boxShadow: '0px -8px 32px 0px rgba(0, 0, 0, 0.6)',
  },
  dockInfo: { gap: t.spacing.xs },
  dockLabel: {
    ...t.typography.overline,
    lineHeight: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  dockPrice: {
    fontFamily: t.fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: t.colors.primary,
  },
  confirm: {
    minWidth: 168,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.xxl,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.25)',
  },
  confirmDisabled: { opacity: t.opacity.disabled },
  confirmLabel: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.background,
  },
  secondaryButton: {
    height: 48,
    paddingHorizontal: t.spacing.xl,
    justifyContent: 'center',
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.buttonNeutral,
  },
  secondaryLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },

  // Success
  successContent: {
    paddingTop: t.spacing.huge,
    paddingHorizontal: t.spacing.xl,
    alignItems: 'center',
    gap: t.spacing.md,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 0px 24px 0px rgba(232, 180, 160, 0.45)',
  },
  successTitle: {
    marginTop: t.spacing.sm,
    fontFamily: t.fontFamily.semibold,
    fontSize: 22,
    lineHeight: 28,
    color: t.colors.text,
  },
  successText: {
    ...t.typography.bodyMedium,
    lineHeight: 21,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  receipt: {
    alignSelf: 'stretch',
    marginTop: t.spacing.lg,
    gap: t.spacing.md,
    padding: 17,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
  },

  // Service picker
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    maxHeight: '70%',
    paddingTop: 9,
    borderTopLeftRadius: t.radii.xxl,
    borderTopRightRadius: t.radii.xxl,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.background,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(53, 52, 56, 0.8)',
  },
  sheetTitle: {
    marginTop: t.spacing.md,
    marginBottom: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  sheetList: {
    paddingHorizontal: t.spacing.xl,
    gap: 10,
  },
}));

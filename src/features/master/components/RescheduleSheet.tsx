/**
 * Move a confirmed booking (`PATCH /api/bookings/{id}/reschedule`): new day,
 * start time and duration (multiple of 15 min). A 409 means it would overlap
 * another confirmed booking. Replaces the web calendar's drag & resize.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { getBookingConflict, type BookingDetailResponse } from '../../../api';
import { useRescheduleBooking } from '../../../query';
import { BottomSheet, Button, ChoiceChips, FieldLabel } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';
import { weekdayDayMonth } from '../../../i18n/dates';
import { addDays, dayKey, hhmm, minutesOf, monthShort, parseDayKey, timeOf, weekdayShort } from '../masterDates';

const DAY_START = 7 * 60;
const DAY_END = 22 * 60;
const STEP = 15;
const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240];

export function RescheduleSheet({ booking, onClose }: { booking: BookingDetailResponse | null; onClose: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const reschedule = useRescheduleBooking();
  const [day, setDay] = useState('');
  const [start, setStart] = useState(0);
  const [duration, setDuration] = useState(60);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 21 }, (_, i) => {
      const d = addDays(today, i);
      return {
        value: dayKey(d),
        label: i === 0 ? t('dates.today') : `${weekdayShort(d)} ${d.getDate()} ${monthShort(d)}`,
      };
    });
  }, [t]);

  const times = useMemo(() => {
    const now = new Date();
    const isToday = day === dayKey(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const list: { value: number; label: string }[] = [];
    for (let m = DAY_START; m + duration <= DAY_END; m += STEP) {
      if (!isToday || m > nowMin) list.push({ value: m, label: hhmm(m) });
    }
    return list;
  }, [day, duration]);

  const seed = () => {
    if (!booking) return;
    setDay(booking.scheduledTime.slice(0, 10));
    setStart(minutesOf(timeOf(booking.scheduledTime)));
    setDuration(booking.durationMinutes);
    reschedule.reset();
  };

  const durations = DURATIONS.includes(booking?.durationMinutes ?? 0)
    ? DURATIONS
    : [...DURATIONS, booking?.durationMinutes ?? 60].sort((a, b) => a - b);
  const valid = !!day && times.some(option => option.value === start);

  const save = () => {
    if (!booking || !valid) return;
    reschedule.mutate(
      {
        bookingId: booking.id,
        scheduledTime: `${day}T${hhmm(start)}:00`,
        durationMinutes: duration,
      },
      {
        onSuccess: onClose,
        onError: e =>
          Alert.alert(
            t('master.reschedule.errorTitle'),
            getBookingConflict(e) ? t('master.reschedule.overlap') : t('master.reschedule.pickAnother'),
          ),
      },
    );
  };

  return (
    <BottomSheet
      visible={booking !== null}
      onClose={onClose}
      onShow={seed}
      title={t('master.booking.reschedule')}
      subtitle={booking ? t('master.reschedule.notified', { name: booking.clientName }) : undefined}
      footer={
        <Button label={t('master.reschedule.save')} onPress={save} disabled={!valid} loading={reschedule.isPending} />
      }
    >
      <FieldLabel>{t('master.reschedule.days')}</FieldLabel>
      <ChoiceChips options={days} value={day} onChange={setDay} accessibilityLabel={t('master.reschedule.days')} />
      <FieldLabel>{t('master.reschedule.duration')}</FieldLabel>
      <ChoiceChips
        options={durations.map(m => ({
          value: m,
          label: m < 60 ? t('units.minutes', { value: m }) : hhmm(m).replace(/^0/, ''),
        }))}
        value={duration}
        onChange={setDuration}
        accessibilityLabel={t('master.reschedule.duration')}
      />
      <FieldLabel>{t('master.reschedule.start')}</FieldLabel>
      {times.length ? (
        <ChoiceChips
          options={times}
          value={start}
          onChange={setStart}
          accessibilityLabel={t('master.reschedule.start')}
        />
      ) : (
        <Text style={styles.hint}>{t('master.reschedule.noTime')}</Text>
      )}
      {!!day && valid && (
        <Text style={styles.hint}>
          {t('booking.appointment', {
            day: weekdayDayMonth(parseDayKey(day)),
            start: hhmm(start),
            end: hhmm(start + duration),
          })}
        </Text>
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  hint: {
    ...t.typography.bodySmall,
    marginTop: t.spacing.md,
    color: t.colors.textSecondary,
  },
}));

/**
 * Master → Calendar: a two-week strip; per day the confirmed visits and the
 * open slots (`GET /api/v1/master/slots`). Add free time for a day
 * (`POST /api/v1/master/slots`, 30-min slots), close / reopen a free slot
 * (`PATCH …/{id}`), reschedule or mark a visit as a no-show.
 * Web counterpart: master/calendar (drag & resize → Reschedule sheet here).
 */
import { CalendarPlus, CalendarX2, Lock, LockOpen, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import type { BookingDetailResponse, SlotResponse } from '../../../api';
import { useBookings, useCreateSlots, useMarkBookingMissed, useMasterSlots, useSetSlotDisabled } from '../../../query';
import { BottomSheet, Button, ChoiceChips, EmptyState, ErrorState, FieldLabel, LoadingState } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { weekdayDayMonth } from '../../../i18n/dates';
import { makeStyles, useTheme } from '../../../theme';
import { TabScreen } from '../../common/TabScreen';
import { RatingSheet } from '../../reviews/RatingSheet';
import { ClientSheet } from '../components/ClientSheet';
import { MasterBookingCard } from '../components/MasterBookingCard';
import { RescheduleSheet } from '../components/RescheduleSheet';
import { addDays, dayHeader, dayKey, parseDayKey, timeOf, weekdayShort } from '../masterDates';

const DAYS_AHEAD = 14;
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07 … 21

export function MasterCalendarScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const todayKey = dayKey(today);
  const days = useMemo(() => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)), [today]);
  const [selected, setSelected] = useState(todayKey);
  const [addFor, setAddFor] = useState<string | null>(null);
  const [clientId, setClientId] = useState<number | null>(null);
  const [moving, setMoving] = useState<BookingDetailResponse | null>(null);
  const [rating, setRating] = useState<BookingDetailResponse | null>(null);

  const bookings = useBookings('as-master');
  const slots = useMasterSlots();
  const toggle = useSetSlotDisabled();
  const markMissed = useMarkBookingMissed();

  const visitsByDay = useMemo(() => {
    const map = new Map<string, BookingDetailResponse[]>();
    for (const b of bookings.data ?? []) {
      if (b.status !== 'SCHEDULED' && b.status !== 'COMPLETED' && b.status !== 'MISSED') continue;
      const key = b.scheduledTime.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    for (const list of map.values()) list.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    return map;
  }, [bookings.data]);

  const freeByDay = useMemo(() => {
    const map = new Map<string, SlotResponse[]>();
    for (const s of slots.data ?? []) {
      if (s.occupied) continue;
      const key = s.startTime.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [slots.data]);

  const visits = visitsByDay.get(selected) ?? [];
  const free = freeByDay.get(selected) ?? [];
  const openCount = free.filter(s => !s.disabled).length;
  const loading = bookings.isPending || slots.isPending;
  const error = bookings.isError || slots.isError;

  const onMarkMissed = (b: BookingDetailResponse) =>
    Alert.alert(t('master.bookings.noShowTitle'), t('master.bookings.noShowText', { name: b.clientName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('master.bookings.noShowConfirm'),
        style: 'destructive',
        onPress: () => markMissed.mutate(b.id),
      },
    ]);

  return (
    <TabScreen
      refreshing={bookings.isRefetching || slots.isRefetching}
      onRefresh={() => {
        bookings.refetch();
        slots.refetch();
      }}
    >
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">
            {t('master.calendar.title')}
          </Text>
          <Text style={styles.subtitle}>{dayHeader(selected, today)}</Text>
        </View>
        <Button
          label={t('master.calendar.freeTime')}
          compact
          icon={<Plus size={16} color={styles.addIcon.color} />}
          onPress={() => setAddFor(selected)}
          accessibilityLabel={t('master.calendar.addFreeTime')}
        />
      </View>

      <WeekStrip
        days={days}
        selected={selected}
        todayKey={todayKey}
        onSelect={setSelected}
        marked={key => visitsByDay.has(key) || freeByDay.has(key)}
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          text={t('master.calendar.loadError')}
          onRetry={() => {
            bookings.refetch();
            slots.refetch();
          }}
        />
      ) : visits.length === 0 && free.length === 0 ? (
        <EmptyState
          Icon={CalendarX2}
          title={t('master.calendar.emptyTitle')}
          text={t('master.calendar.emptyText')}
          action={
            <Button
              label={t('master.calendar.addFreeTime')}
              onPress={() => setAddFor(selected)}
              style={styles.stretch}
            />
          }
        />
      ) : (
        <>
          {visits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('master.calendar.visits', { count: visits.length })}</Text>
              {visits.map(b => (
                <MasterBookingCard
                  key={b.id}
                  booking={b}
                  busy={markMissed.isPending}
                  onOpenClient={setClientId}
                  onReschedule={setMoving}
                  onMarkMissed={onMarkMissed}
                  onRate={setRating}
                />
              ))}
            </View>
          )}
          {free.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {free.length > openCount
                  ? t('master.calendar.freeSlotsClosed', { open: openCount, closed: free.length - openCount })
                  : t('master.calendar.freeSlots', { open: openCount })}
              </Text>
              <View style={styles.slots}>
                {free.map(s => (
                  <SlotChip
                    key={s.id}
                    slot={s}
                    busy={toggle.isPending && toggle.variables?.slotId === s.id}
                    onToggle={() =>
                      toggle.mutate(
                        { slotId: s.id, disabled: !s.disabled },
                        {
                          onError: () => Alert.alert(t('master.calendar.slotError'), t('common.pleaseTryAgain')),
                        },
                      )
                    }
                  />
                ))}
              </View>
              <Text style={styles.hint}>{t('master.calendar.slotHint')}</Text>
            </View>
          )}
        </>
      )}

      <AddSlotsSheet dateKey={addFor} onClose={() => setAddFor(null)} onSaved={key => setSelected(key)} />
      <ClientSheet clientId={clientId} onClose={() => setClientId(null)} />
      <RescheduleSheet booking={moving} onClose={() => setMoving(null)} />
      <RatingSheet booking={rating} target="client" onClose={() => setRating(null)} />
    </TabScreen>
  );
}

function WeekStrip({
  days,
  selected,
  todayKey,
  onSelect,
  marked,
}: {
  days: Date[];
  selected: string;
  todayKey: string;
  onSelect: (key: string) => void;
  marked: (key: string) => boolean;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    const index = days.findIndex(d => dayKey(d) === selected);
    if (index > 3) ref.current?.scrollTo({ x: (index - 2) * 62, animated: true });
  }, [days, selected]);

  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {days.map(d => {
        const key = dayKey(d);
        const active = key === selected;
        const isToday = key === todayKey;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={dayHeader(key)}
            style={[styles.day, active && styles.dayActive]}
          >
            <Text style={[styles.dayName, active && styles.dayTextActive, isToday && !active && styles.today]}>
              {isToday ? t('dates.today') : weekdayShort(d)}
            </Text>
            <Text style={[styles.dayNumber, active && styles.dayTextActive]}>{d.getDate()}</Text>
            <View style={[styles.dot, marked(key) ? (active ? styles.dotActive : styles.dotOn) : undefined]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SlotChip({ slot, busy, onToggle }: { slot: SlotResponse; busy: boolean; onToggle: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const closed = slot.disabled;
  return (
    <Pressable
      onPress={onToggle}
      disabled={busy}
      accessibilityRole="switch"
      accessibilityState={{ checked: !closed, busy }}
      accessibilityLabel={t(closed ? 'master.calendar.slotClosed' : 'master.calendar.slotOpen', {
        time: timeOf(slot.startTime),
      })}
      style={({ pressed }) => [styles.slot, closed && styles.slotClosed, (pressed || busy) && styles.pressed]}
    >
      {closed ? <Lock size={12} color={colors.textSecondary} /> : <LockOpen size={12} color={colors.primary} />}
      <Text style={[styles.slotText, closed && styles.slotTextClosed]}>{timeOf(slot.startTime)}</Text>
    </Pressable>
  );
}

function AddSlotsSheet({
  dateKey,
  onClose,
  onSaved,
}: {
  dateKey: string | null;
  onClose: () => void;
  onSaved: (key: string) => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const create = useCreateSlots();
  const [day, setDay] = useState('');
  const [from, setFrom] = useState(9);
  const [to, setTo] = useState(18);
  const count = to > from ? (to - from) * 2 : 0;

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = addDays(today, i);
      return {
        value: dayKey(d),
        label: i === 0 ? t('dates.today') : `${weekdayShort(d)} ${d.getDate()}`,
      };
    });
  }, [t]);

  const save = () =>
    create.mutate(
      { date: day, startHour: from, endHour: to },
      {
        onSuccess: () => {
          onSaved(day);
          onClose();
        },
        onError: () => Alert.alert(t('master.calendar.addError'), t('common.pleaseTryAgain')),
      },
    );

  const d = day ? parseDayKey(day) : null;
  return (
    <BottomSheet
      visible={dateKey !== null}
      onClose={onClose}
      onShow={() => {
        setDay(dateKey ?? dayKey(new Date()));
        create.reset();
      }}
      title={t('master.calendar.addFreeTime')}
      subtitle={d ? t('master.calendar.addSubtitle', { date: weekdayDayMonth(d) }) : undefined}
      footer={
        <Button
          label={count ? t('master.calendar.openSlots', { count }) : t('master.calendar.pickRange')}
          icon={count ? <CalendarPlus size={16} color={colors.background} /> : undefined}
          onPress={save}
          disabled={!count || !day}
          loading={create.isPending}
        />
      }
    >
      <FieldLabel>{t('master.reschedule.days')}</FieldLabel>
      <ChoiceChips options={days} value={day} onChange={setDay} accessibilityLabel={t('master.reschedule.days')} />
      <FieldLabel>{t('master.calendar.from')}</FieldLabel>
      <ChoiceChips
        options={HOURS.filter(h => h < to).map(h => ({
          value: h,
          label: `${String(h).padStart(2, '0')}:00`,
        }))}
        value={from}
        onChange={setFrom}
        accessibilityLabel={t('master.calendar.from')}
      />
      <FieldLabel>{t('master.calendar.until')}</FieldLabel>
      <ChoiceChips
        options={HOURS.filter(h => h > from).map(h => ({
          value: h,
          label: `${String(h).padStart(2, '0')}:00`,
        }))}
        value={to}
        onChange={setTo}
        accessibilityLabel={t('master.calendar.until')}
      />
      {count > 0 && (
        <Text style={styles.hint}>
          {t('master.calendar.rangeHint', {
            count,
            from: `${String(from).padStart(2, '0')}:00`,
            to: `${String(to).padStart(2, '0')}:00`,
          })}
        </Text>
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  stretch: { alignSelf: 'stretch' },
  pressed: { opacity: t.opacity.pressed },
  addIcon: { color: t.colors.background },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.md },
  title: {
    fontFamily: t.fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: '#FFFFFF',
  },
  subtitle: {
    ...t.typography.bodySmall,
    marginTop: 2,
    color: t.colors.textSecondary,
  },
  strip: { gap: t.spacing.sm, paddingRight: t.spacing.xl },
  day: {
    width: 54,
    alignItems: 'center',
    gap: 2,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  dayActive: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.25)',
  },
  dayName: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  today: { color: t.colors.primary },
  dayNumber: {
    fontFamily: t.fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    color: t.colors.text,
  },
  dayTextActive: { color: t.colors.background },
  dot: { width: 5, height: 5, borderRadius: t.radii.full },
  dotOn: { backgroundColor: t.colors.primary },
  dotActive: { backgroundColor: t.colors.background },
  section: { gap: t.spacing.md },
  sectionTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    color: t.colors.textAccent,
    paddingHorizontal: t.spacing.xs,
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  slot: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderStyle: 'dashed',
    borderColor: 'rgba(232, 180, 160, 0.4)',
    backgroundColor: 'rgba(232, 180, 160, 0.06)',
  },
  slotClosed: {
    borderStyle: 'solid',
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
  },
  slotText: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.text,
  },
  slotTextClosed: {
    color: t.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  hint: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
    paddingHorizontal: t.spacing.xs,
    marginTop: t.spacing.sm,
  },
}));

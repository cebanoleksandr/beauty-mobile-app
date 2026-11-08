/**
 * Week strip with previous/next week arrows. Figma node 7:1029. Days come
 * from the master's availability (14-day horizon); a dot marks days with a
 * start time that fits the selected service, other days are dimmed.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import ChevronLeft from '../../../assets/icons/booking/chevron-left.svg';
import ChevronRight from '../../../assets/icons/booking/chevron-right.svg';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';
import { dayOfMonth, monthShort, monthYear, weekdayShort } from '../bookingSlots';

interface DatePickerProps {
  weeks: string[][];
  weekIndex: number;
  onWeekChange: (index: number) => void;
  selected: string | null;
  /** Days that have at least one valid start for the selected service. */
  bookableDays: ReadonlySet<string>;
  onSelect: (date: string) => void;
}

export function DatePicker({ weeks, weekIndex, onWeekChange, selected, bookableDays, onSelect }: DatePickerProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const week = weeks[weekIndex] ?? [];
  const anchor = selected && week.includes(selected) ? selected : week[0];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('booking.selectDate')}</Text>
          {!!anchor && <Text style={styles.subtitle}>{monthYear(anchor)}</Text>}
        </View>
        <View style={styles.nav}>
          <Pressable
            onPress={() => onWeekChange(weekIndex - 1)}
            disabled={weekIndex === 0}
            accessibilityRole="button"
            accessibilityLabel={t('booking.prevWeek')}
            style={[styles.navButton, weekIndex === 0 && styles.disabled]}
          >
            <ChevronLeft />
          </Pressable>
          <Text style={styles.navLabel}>{anchor ? monthShort(anchor).toUpperCase() : ''}</Text>
          <Pressable
            onPress={() => onWeekChange(weekIndex + 1)}
            disabled={weekIndex >= weeks.length - 1}
            accessibilityRole="button"
            accessibilityLabel={t('booking.nextWeek')}
            style={[styles.navButton, weekIndex >= weeks.length - 1 && styles.disabled]}
          >
            <ChevronRight />
          </Pressable>
        </View>
      </View>

      <View style={styles.days}>
        {week.map(date => {
          const isSelected = date === selected;
          const bookable = bookableDays.has(date);
          return (
            <Pressable
              key={date}
              onPress={() => onSelect(date)}
              disabled={!bookable}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: !bookable }}
              accessibilityLabel={`${weekdayShort(date)} ${dayOfMonth(date)}`}
              style={[styles.day, isSelected ? styles.daySelected : bookable ? styles.dayOpen : styles.dayClosed]}
            >
              <Text style={[styles.weekday, isSelected && styles.weekdaySelected, !bookable && styles.muted]}>
                {weekdayShort(date).toUpperCase()}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected, !bookable && styles.muted]}>
                {dayOfMonth(date)}
              </Text>
              <View style={[styles.dot, isSelected ? styles.dotSelected : bookable ? styles.dotOpen : undefined]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  section: { gap: t.spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  subtitle: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: t.radii.md,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.3 },
  navLabel: {
    minWidth: 36,
    textAlign: 'center',
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.text,
  },
  days: {
    paddingTop: t.spacing.xs,
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
  },
  dayOpen: {
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  dayClosed: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: t.colors.card,
    opacity: 0.45,
  },
  daySelected: {
    paddingVertical: 10,
    borderColor: t.colors.primaryContainer,
    backgroundColor: t.colors.primary,
    boxShadow: `0px 0px 0px 2px ${t.colors.primaryContainer}, 0px 4px 20px 0px rgba(232, 180, 160, 0.35)`,
  },
  weekday: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
    color: t.colors.textAccent,
  },
  weekdaySelected: {
    fontFamily: t.fontFamily.extrabold,
    color: t.colors.onPrimary,
  },
  dayNumber: {
    marginTop: t.spacing.xs,
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.textAccent,
  },
  dayNumberSelected: {
    marginTop: 2,
    fontFamily: t.fontFamily.extrabold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.background,
  },
  muted: { color: t.colors.textSecondary },
  dot: {
    marginTop: 6,
    width: 4,
    height: 4,
    borderRadius: t.radii.full,
  },
  dotOpen: { backgroundColor: '#CEBDFF' },
  dotSelected: {
    marginTop: 4,
    width: 6,
    height: 6,
    backgroundColor: t.colors.background,
  },
}));

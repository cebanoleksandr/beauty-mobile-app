/**
 * Available start times grouped Morning / Afternoon / Evening. Figma node
 * 7:1095. Times that are taken — or don't leave enough free time for the
 * service — are struck through and disabled.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import TimeCheck from '../../../assets/icons/booking/time-check.svg';
import type { TimeSlotDto } from '../../../api';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';
import { groupByPeriod } from '../bookingSlots';

interface TimeSlotGridProps {
  slots: readonly TimeSlotDto[];
  validStarts: ReadonlySet<string>;
  selected: string | null;
  onSelect: (time: string) => void;
}

export function TimeSlotGrid({ slots, validStarts, selected, onSelect }: TimeSlotGridProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const groups = groupByPeriod(slots);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('booking.timeSlots')}</Text>
      {groups.length === 0 ? (
        <Text style={styles.empty}>{t('booking.noSlotsDay')}</Text>
      ) : (
        groups.map(group => (
          <View key={group.period} style={styles.group}>
            <Text style={styles.period}>{t(`booking.period.${group.period}`)}</Text>
            <View style={styles.grid}>
              {group.slots.map(slot => {
                const ok = validStarts.has(slot.time);
                const isSelected = slot.time === selected;
                return (
                  <Pressable
                    key={slot.time}
                    onPress={() => onSelect(slot.time)}
                    disabled={!ok}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: !ok }}
                    accessibilityLabel={slot.time}
                    style={[styles.chip, isSelected ? styles.chipSelected : ok ? styles.chipOpen : styles.chipTaken]}
                  >
                    {isSelected && <TimeCheck />}
                    <Text style={[styles.time, isSelected ? styles.timeSelected : !ok && styles.timeTaken]}>
                      {slot.time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  section: { gap: t.spacing.md },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  empty: {
    ...t.typography.bodyMedium,
    color: t.colors.textSecondary,
  },
  group: { gap: t.spacing.sm },
  period: {
    ...t.typography.overline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
  },
  chip: {
    // three per row: (100% - 2 gaps) / 3
    width: '31.6%',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: t.radii.md,
    borderWidth: t.borderWidth.thin,
  },
  chipOpen: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: t.colors.cardInner,
  },
  chipTaken: {
    borderColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: 'rgba(27, 27, 30, 0.5)',
  },
  chipSelected: {
    borderColor: t.colors.primaryContainer,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 0px 12px 0px rgba(232, 180, 160, 0.35)',
  },
  time: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.text,
  },
  timeSelected: {
    fontFamily: t.fontFamily.bold,
    color: t.colors.background,
  },
  timeTaken: {
    color: 'rgba(157, 141, 136, 0.4)',
    textDecorationLine: 'line-through',
  },
}));

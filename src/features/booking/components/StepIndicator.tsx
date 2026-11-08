/** "1. Service · 2. Date & Time · 3. Review" progress. Figma node 7:964. */
import React from 'react';
import { Text, View } from 'react-native';
import StepCheck from '../../../assets/icons/booking/step-check.svg';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';

const STEPS = ['booking.steps.service', 'booking.steps.datetime', 'booking.steps.review'] as const;

/** `current` is 1-based; earlier steps render as done. */
export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={styles.labels}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < current ? 'done' : n === current ? 'active' : 'todo';
          return (
            <View key={label} style={styles.step} accessibilityState={{ selected: state === 'active' }}>
              <View style={[styles.badge, styles[`badge_${state}`]]}>
                {state === 'done' ? (
                  <StepCheck />
                ) : (
                  <Text style={[styles.badgeText, styles[`badgeText_${state}`]]}>{n}</Text>
                )}
              </View>
              <Text style={[styles.label, styles[`label_${state}`]]}>
                {n}. {t(label)}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.bar}>
        {STEPS.map((label, i) => (
          <View
            key={label}
            style={[
              styles.segment,
              i + 1 <= current ? styles.segmentOn : styles.segmentOff,
              i + 1 === current && styles.segmentCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  root: {
    gap: t.spacing.sm,
    paddingTop: t.spacing.xs,
    paddingBottom: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge_done: { backgroundColor: 'rgba(232, 180, 160, 0.2)' },
  badge_active: { backgroundColor: t.colors.primary },
  badge_todo: { backgroundColor: t.colors.buttonNeutral },
  badgeText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
  },
  badgeText_done: {},
  badgeText_active: { color: t.colors.background },
  badgeText_todo: { color: t.colors.textSecondary },
  label: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  label_done: { fontFamily: t.fontFamily.medium, color: t.colors.primary },
  label_active: { fontFamily: t.fontFamily.bold, color: t.colors.primaryContainer },
  label_todo: { fontFamily: t.fontFamily.regular, color: t.colors.textSecondary },
  bar: {
    height: 4,
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    borderRadius: t.radii.full,
  },
  segmentOn: { backgroundColor: t.colors.primary },
  segmentOff: { backgroundColor: t.colors.buttonNeutral },
  segmentCurrent: { boxShadow: '0px 0px 12px 0px rgba(232, 180, 160, 0.4)' },
}));

/**
 * One priced service (a MasterOffer). Figma node 7:726, without the "Popular"
 * badge and description line — the backend has neither.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import ClockIcon from '../../../assets/icons/master/clock.svg';
import type { MasterServiceDto } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { formatPrice } from '../../../shared/format';
import { makeStyles } from '../../../theme';
import { formatDuration } from '../profileFormat';

interface ServiceRowProps {
  service: MasterServiceDto;
  selected: boolean;
  onSelect: (service: MasterServiceDto) => void;
}

export function ServiceRow({ service, selected, onSelect }: ServiceRowProps) {
  const styles = useStyles();
  const tr = useTranslate();
  const name = tr(service.name);

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.meta}>
          <View style={styles.duration}>
            <ClockIcon />
            <Text style={styles.metaText}>{formatDuration(service.durationMinutes)}</Text>
          </View>
          <Text style={styles.price}>{formatPrice(service.price)}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => onSelect(service)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${selected ? 'Selected' : 'Select'} ${name}`}
        style={({ pressed }) => [styles.button, selected && styles.buttonSelected, pressed && styles.pressed]}
      >
        <Text style={[styles.buttonLabel, selected && styles.buttonLabelSelected]}>
          {selected ? 'Selected' : 'Select'}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  cardSelected: {
    borderColor: 'rgba(232, 180, 160, 0.4)',
  },
  info: {
    flex: 1,
    paddingRight: t.spacing.md,
    gap: 3.5,
  },
  name: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  metaText: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  price: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: t.colors.primary,
  },
  button: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: t.colors.buttonNeutral,
  },
  buttonSelected: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primary,
  },
  pressed: { opacity: t.opacity.pressed },
  buttonLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: '#FFFFFF',
  },
  buttonLabelSelected: {
    color: t.colors.onPrimary,
  },
}));

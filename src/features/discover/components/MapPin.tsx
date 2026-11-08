/**
 * Price pins on the map. Figma: regular pin 7:368 ("$80 · Maya"),
 * selected/featured pin 7:405 (avatar + overline + price, peach outline).
 */
import React, { memo } from 'react';
import { Image, Text, View } from 'react-native';
import { resolveApiUrl, type MasterCardDto } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { firstName, formatPrice } from '../../../shared/format';
import { makeStyles, useTheme } from '../../../theme';

interface MapPinProps {
  master: MasterCardDto;
  selected: boolean;
}

export const MapPin = memo(function MapPinView({ master, selected }: MapPinProps) {
  const styles = useStyles();
  const { colors, palette } = useTheme();
  const tr = useTranslate();
  const label = `${formatPrice(master.startingPrice)} · ${firstName(master.displayName)}`;

  if (selected) {
    const avatar = resolveApiUrl(master.avatarUrl);
    const overline = tr(master.category) || 'Master';
    return (
      <View style={styles.column}>
        <View style={styles.selectedBubble}>
          <View style={styles.avatar}>
            {avatar && <Image source={{ uri: avatar }} style={styles.avatarImage} />}
          </View>
          <View>
            <Text style={styles.overline} numberOfLines={1}>
              {overline}
            </Text>
            <Text style={styles.selectedLabel} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </View>
        <View style={styles.selectedTail} />
        <View style={styles.locationDot} />
      </View>
    );
  }

  // Dot colour hints at quality: top-rated peach, good lavender, others muted.
  const rating = master.rating ?? 0;
  const dotColor =
    rating >= 4.8 ? colors.primary : rating >= 4.5 ? palette.secondary[80] : colors.textSecondary;

  return (
    <View style={styles.column}>
      <View style={styles.bubble}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={styles.tail} />
    </View>
  );
});

const PIN_BORDER = 'rgba(81, 68, 63, 0.5)';

const useStyles = makeStyles(t => ({
  column: {
    alignItems: 'center',
  },

  // Regular pin
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: PIN_BORDER,
    backgroundColor: 'rgba(42, 42, 45, 0.9)',
    boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
  },
  label: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.text,
  },
  tail: {
    width: 8,
    height: 8,
    marginTop: -4.5,
    transform: [{ rotate: '45deg' }],
    backgroundColor: t.colors.buttonNeutral,
    borderRightWidth: t.borderWidth.thin,
    borderBottomWidth: t.borderWidth.thin,
    borderColor: PIN_BORDER,
  },

  // Selected pin
  selectedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: t.spacing.sm,
    paddingRight: 14,
    paddingVertical: 6,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thick,
    borderColor: t.colors.primary,
    backgroundColor: 'rgba(42, 42, 45, 0.95)',
    boxShadow:
      '0px 0px 0px 2px rgba(232, 180, 160, 0.2), 0px 4px 24px 0px rgba(232, 180, 160, 0.45), 0px 0px 24px 8px rgba(232, 180, 160, 0.25)',
    zIndex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    marginRight: t.spacing.sm,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.8)',
    backgroundColor: t.colors.cardInner,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  overline: {
    ...t.typography.overline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: t.colors.primaryContainer,
    maxWidth: 140,
  },
  selectedLabel: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 17.5,
    letterSpacing: 0.28,
    color: t.colors.text,
  },
  selectedTail: {
    width: 12,
    height: 12,
    marginTop: -8.5,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    backgroundColor: t.colors.primary,
  },
  locationDot: {
    width: 8,
    height: 8,
    marginTop: t.spacing.xs,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(232, 180, 160, 0.7)',
    boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
  },
}));

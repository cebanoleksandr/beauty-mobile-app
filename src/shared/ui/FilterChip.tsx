/**
 * Selectable pill. Styles are the design's quick-filter chips (Figma 7:460
 * selected, 7:467 idle), which now live in the filters sheet.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles } from '../../theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.chip, selected ? styles.selected : styles.idle, pressed && styles.pressed]}
    >
      {selected && <View style={styles.dot} />}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
  },
  idle: {
    borderColor: t.colors.glassBorder,
    backgroundColor: 'rgba(27, 27, 30, 0.9)',
  },
  selected: {
    borderColor: t.palette.secondary[80],
    backgroundColor: 'rgba(80, 40, 174, 0.3)',
    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
  },
  pressed: { opacity: t.opacity.pressed },
  dot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: '#CEBDFF',
  },
  label: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textAccent,
  },
  labelSelected: {
    color: t.colors.text,
  },
}));

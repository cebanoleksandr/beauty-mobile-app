import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../../theme';

interface DotBadgeProps {
  label: string;
  /** Pill fill — translucent on imagery, `card` on plain backgrounds. */
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  /** Gap between the dot and the label. */
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/** Small uppercase pill with a peach status dot ("STEP 1 OF 2", brand tag). */
export function DotBadge({ label, backgroundColor, borderColor, textColor, gap = 6, style }: DotBadgeProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: backgroundColor ?? colors.card, borderColor: borderColor ?? colors.borderSubtle },
        style,
      ]}
    >
      <View style={styles.dot} />
      <Text style={[styles.label, { marginLeft: gap, color: textColor ?? colors.textAccent }]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
  },
  label: {
    ...t.typography.overline,
    textTransform: 'uppercase',
  },
}));

/** "Search this area" pill. Figma node 7:421. */
import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import SearchAreaIcon from '../../../assets/icons/search-area.svg';
import { makeStyles, useTheme } from '../../../theme';

export function SearchAreaButton({ onPress, loading }: { onPress: () => void; loading?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      {loading ? <ActivityIndicator size="small" color={colors.primaryContainer} /> : <SearchAreaIcon />}
      <Text style={styles.label}>Search this area</Text>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.glass,
    boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  pressed: { opacity: t.opacity.pressed },
  label: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.primaryContainer,
  },
}));

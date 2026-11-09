/**
 * Pin for a search center picked by tapping the map (the web app's
 * CENTER_ICON, in this app's colours). Anchored at its tip.
 */
import React from 'react';
import { View } from 'react-native';
import { makeStyles } from '../../../theme';

export function SearchCenterPin() {
  const styles = useStyles();
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.drop}>
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  wrap: {
    width: 28,
    height: 34,
    alignItems: 'center',
  },
  // A rounded square with one sharp corner, rotated so the corner points down.
  drop: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 12,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px 0px rgba(0, 0, 0, 0.45)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.onPrimary,
  },
}));

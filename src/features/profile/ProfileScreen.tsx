/** Placeholder profile tab: who's signed in, current mode, sign out. */
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useSignOut } from '../../auth';
import { useMe } from '../../query';
import { ScreenPlaceholder } from '../../shared/ui';
import { makeStyles } from '../../theme';

export function ProfileScreen() {
  const styles = useStyles();
  const { data: me } = useMe();
  const signOut = useSignOut();

  return (
    <ScreenPlaceholder
      title={me?.firstName ? `Hi, ${me.firstName}` : 'Profile'}
      text={`Mode: ${me?.context ?? '—'}`}
    >
      <Pressable onPress={signOut} accessibilityRole="button" style={styles.button}>
        <Text style={styles.buttonLabel}>Sign out</Text>
      </Pressable>
    </ScreenPlaceholder>
  );
}

const useStyles = makeStyles(t => ({
  button: {
    marginTop: t.spacing.xxl,
    alignSelf: 'flex-start',
    paddingHorizontal: t.spacing.lg,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.sm,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.border,
  },
  buttonLabel: { ...t.typography.labelLarge, color: t.colors.text },
}));

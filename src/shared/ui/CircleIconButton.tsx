import React, { type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { makeStyles } from '../../theme';

interface CircleIconButtonProps {
  icon: ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/** 40×40 round header button (back, help, …). */
export function CircleIconButton({ icon, onPress, accessibilityLabel, disabled }: CircleIconButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {icon}
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  button: {
    width: t.sizes.iconButtonLg,
    height: t.sizes.iconButtonLg,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.card,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
  },
  pressed: { opacity: t.opacity.pressed },
}));

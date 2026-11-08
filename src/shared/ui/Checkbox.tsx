/** Labelled checkbox — square version of the design's radio indicator. */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import CheckIcon from '../../assets/icons/check.svg';
import { makeStyles } from '../../theme';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onChange}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked ? styles.boxOn : styles.boxOff]}>{checked && <CheckIcon />}</View>
      <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  pressed: { opacity: t.opacity.pressed },
  box: {
    width: 22,
    height: 22,
    borderRadius: t.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: t.colors.primary },
  boxOff: {
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(157, 141, 136, 0.5)',
  },
  label: {
    flex: 1,
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textAccent,
  },
  labelChecked: { color: t.colors.text },
}));

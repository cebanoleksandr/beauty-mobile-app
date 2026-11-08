/**
 * Single-choice list. The indicator is the role-select radio from the design
 * (Figma 7:1935 selected / 7:1973 idle).
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import CheckIcon from '../../assets/icons/check.svg';
import CheckUnselectedIcon from '../../assets/icons/check-unselected.svg';
import { makeStyles } from '../../theme';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  value: T;
  options: readonly RadioOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function RadioGroup<T extends string>({ value, options, onChange, accessibilityLabel }: RadioGroupProps<T>) {
  const styles = useStyles();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
            <View style={[styles.indicator, selected ? styles.indicatorOn : styles.indicatorOff]}>
              {selected ? <CheckIcon /> : <CheckUnselectedIcon />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { opacity: t.opacity.pressed },
  label: {
    fontFamily: t.fontFamily.regular,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.textAccent,
  },
  labelSelected: {
    fontFamily: t.fontFamily.semibold,
    color: t.colors.text,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorOn: { backgroundColor: t.colors.primary },
  indicatorOff: {
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(157, 141, 136, 0.5)',
  },
}));

/**
 * Form primitives shared by the sheets and editor screens: field label,
 * text field, primary / secondary / danger buttons and a chip choice row.
 * Styled after the Settings edit sheet and the booking flow.
 */
import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { makeStyles, useTheme } from '../../theme';

export function FieldLabel({ children }: { children: string }) {
  const styles = useStyles();
  return <Text style={styles.label}>{children}</Text>;
}

export function TextField({ multiline, style, ...props }: TextInputProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[styles.input, multiline && styles.inputMultiline, style]}
      {...props}
    />
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  compact,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const fg = {
    primary: colors.background,
    secondary: colors.text,
    danger: '#FB7185',
    ghost: colors.textSecondary,
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        styles[`button_${variant}` as const],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonLabel, compact && styles.buttonLabelCompact, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
}

/** Wrapping row of selectable chips (hours, durations, periods). */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map(o => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  label: {
    ...t.typography.overline,
    marginTop: t.spacing.lg,
    marginBottom: t.spacing.sm,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
    fontFamily: t.fontFamily.regular,
    fontSize: 15,
    color: t.colors.text,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: t.spacing.md,
    paddingBottom: t.spacing.md,
  },
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: t.spacing.md },
  button_primary: {
    borderColor: t.colors.primary,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.2)',
  },
  button_secondary: {
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.buttonNeutral,
  },
  button_danger: {
    borderColor: 'rgba(244, 63, 94, 0.2)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  button_ghost: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  disabled: { opacity: t.opacity.disabled },
  pressed: { opacity: t.opacity.pressed },
  buttonLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
  },
  buttonLabelCompact: { fontSize: 13 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
  },
  chip: {
    minWidth: 64,
    alignItems: 'center',
    paddingHorizontal: t.spacing.md,
    paddingVertical: 9,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
  },
  chipSelected: {
    borderColor: 'rgba(232, 180, 160, 0.5)',
    backgroundColor: 'rgba(232, 180, 160, 0.15)',
  },
  chipLabel: {
    fontFamily: t.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textAccent,
  },
  chipLabelSelected: {
    fontFamily: t.fontFamily.semibold,
    color: t.colors.primary,
  },
}));

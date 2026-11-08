/** Inline dropdown: a field that expands into a list of options below it. */
import { Check, ChevronDown, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../../theme';

interface SelectFieldProps {
  value: string;
  options: readonly { value: string; label: string }[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Extra last row, e.g. "Request a new category". */
  extraLabel?: string;
  onExtra?: () => void;
  accessibilityLabel: string;
}

export function SelectField({
  value,
  options,
  placeholder,
  onChange,
  disabled,
  extraLabel,
  onExtra,
  accessibilityLabel,
}: SelectFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(o => !o)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        style={[styles.field, open && styles.fieldOpen, disabled && styles.disabled]}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} style={open ? styles.chevronOpen : undefined} />
      </Pressable>
      {open && (
        <View style={styles.list}>
          <ScrollView nestedScrollEnabled style={styles.scroll} keyboardShouldPersistTaps="handled">
            {options.map(o => (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text style={[styles.optionLabel, o.value === value && styles.optionSelected]}>{o.label}</Text>
                {o.value === value && <Check size={16} color={colors.primary} />}
              </Pressable>
            ))}
            {extraLabel && onExtra && (
              <Pressable
                onPress={() => {
                  setOpen(false);
                  onExtra();
                }}
                accessibilityRole="menuitem"
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text style={styles.extra}>{extraLabel}</Text>
                <Plus size={16} color={colors.primary} />
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
  },
  fieldOpen: { borderColor: 'rgba(232, 180, 160, 0.5)' },
  disabled: { opacity: t.opacity.disabled },
  pressed: { opacity: t.opacity.pressed },
  value: {
    flex: 1,
    fontFamily: t.fontFamily.regular,
    fontSize: 15,
    color: t.colors.text,
  },
  placeholder: { color: t.colors.textMuted },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  list: {
    marginTop: t.spacing.xs,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
    overflow: 'hidden',
  },
  scroll: { maxHeight: 240 },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    borderBottomWidth: t.borderWidth.hairline,
    borderBottomColor: t.colors.borderSubtle,
  },
  optionLabel: {
    ...t.typography.bodyMedium,
    flex: 1,
    color: t.colors.textAccent,
  },
  optionSelected: { fontFamily: t.fontFamily.semibold, color: t.colors.text },
  extra: { ...t.typography.labelLarge, flex: 1, color: t.colors.primary },
}));

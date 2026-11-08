/**
 * Search input + filters button. Figma node 7:444. The quick-filter chips
 * that sat under the input in the design live in the filters sheet instead.
 */
import React from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import ClearIcon from '../../../assets/icons/clear.svg';
import FiltersIcon from '../../../assets/icons/filters.svg';
import SearchIcon from '../../../assets/icons/search.svg';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onOpenFilters: () => void;
  activeFilters: number;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({ value, onChangeText, onOpenFilters, activeFilters, style }: SearchBarProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.row, style]}>
      <View style={styles.input}>
        <SearchIcon />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('discover.search.placeholder')}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.textInput}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('discover.search.clear')}
            style={styles.clear}
          >
            <ClearIcon />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={onOpenFilters}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilters ? t('discover.search.filtersActive', { count: activeFilters }) : t('discover.search.filters')
        }
        style={({ pressed }) => [styles.filters, pressed && styles.pressed]}
      >
        <FiltersIcon />
        {activeFilters > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilters}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const SHADOW = '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)';

const useStyles = makeStyles(t => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.glass,
    boxShadow: SHADOW,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    color: t.colors.text,
  },
  clear: {
    padding: t.spacing.xs,
  },
  filters: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.glass,
    boxShadow: SHADOW,
  },
  pressed: { opacity: t.opacity.pressed },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    color: t.colors.onPrimary,
  },
}));

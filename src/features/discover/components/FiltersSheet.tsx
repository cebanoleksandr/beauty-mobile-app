/**
 * Filters opened from the search bar's filter button. Edits a draft and
 * commits it on "Show results", so the map doesn't refetch on every tap.
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslate } from '../../../i18n/language';
import { useCatalog } from '../../../query';
import { FilterChip } from '../../../shared/ui';
import { makeStyles, useTheme } from '../../../theme';
import { DEFAULT_FILTERS, RADIUS_OPTIONS, type SearchFilters, type SortOption } from '../searchFilters';

interface FiltersSheetProps {
  visible: boolean;
  value: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'distance', label: 'Nearest' },
  { value: 'rating', label: 'Top rated' },
];

export function FiltersSheet({ visible, value, onApply, onClose }: FiltersSheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tr = useTranslate();
  const { data: catalog } = useCatalog();
  const [draft, setDraft] = useState(value);

  // Start from the applied filters every time the sheet opens.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const toggleCategory = (id: string) =>
    setDraft(d => ({
      ...d,
      categoryIds: d.categoryIds.includes(id) ? d.categoryIds.filter(c => c !== id) : [...d.categoryIds, id],
    }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters</Text>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.section}>Category</Text>
          <View style={styles.chips}>
            {(catalog ?? []).map(category => (
              <FilterChip
                key={category.id}
                label={tr(category.name)}
                selected={draft.categoryIds.includes(category.id)}
                onPress={() => toggleCategory(category.id)}
              />
            ))}
          </View>

          <Text style={styles.section}>Sort by</Text>
          <View style={styles.chips}>
            {SORT_OPTIONS.map(option => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={draft.sort === option.value}
                onPress={() => setDraft(d => ({ ...d, sort: option.value }))}
              />
            ))}
          </View>

          <Text style={styles.section}>Distance</Text>
          <View style={styles.chips}>
            {RADIUS_OPTIONS.map(radius => (
              <FilterChip
                key={radius}
                label={`${radius / 1000} km`}
                selected={draft.radiusMeters === radius}
                onPress={() => setDraft(d => ({ ...d, radiusMeters: radius }))}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Favorites only</Text>
            <Switch
              value={draft.favoritesOnly}
              onValueChange={favoritesOnly => setDraft(d => ({ ...d, favoritesOnly }))}
              trackColor={{ true: colors.primary, false: colors.surfaceVariant }}
              thumbColor={colors.text}
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            onPress={() => setDraft(DEFAULT_FILTERS)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, styles.reset, pressed && styles.pressed]}
          >
            <Text style={styles.resetLabel}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={() => onApply(draft)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, styles.apply, pressed && styles.pressed]}
          >
            <Text style={styles.applyLabel}>Show results</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(t => ({
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    maxHeight: '80%',
    paddingTop: 9,
    borderTopLeftRadius: t.radii.xxl,
    borderTopRightRadius: t.radii.xxl,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.card,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(53, 52, 56, 0.8)',
  },
  title: {
    marginTop: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  content: {
    paddingHorizontal: t.spacing.xl,
    paddingBottom: t.spacing.lg,
  },
  section: {
    ...t.typography.overline,
    marginTop: t.spacing.xl,
    marginBottom: t.spacing.sm,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.sm,
  },
  switchRow: {
    marginTop: t.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...t.typography.bodyMedium,
    color: t.colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: t.radii.lg,
    alignItems: 'center',
  },
  reset: {
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.buttonNeutral,
  },
  apply: {
    backgroundColor: t.colors.primary,
  },
  pressed: { opacity: t.opacity.pressed },
  resetLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  applyLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.onPrimary,
  },
}));

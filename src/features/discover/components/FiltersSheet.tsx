/**
 * Filters sheet, opened from the search bar's filter button. Port of the web
 * app's FilterDrawer, styled with this app's theme:
 *
 * - edits a draft; closing (✕ / backdrop / back button) discards it,
 *   "Reset all" resets it, the footer CTA commits it;
 * - while open, the draft is searched in the background so the CTA can say
 *   how many masters it will show ("Show 18 masters").
 */
import type { LngLat } from '@maplibre/maplibre-react-native';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMasterSearch } from '../../../query';
import { formatPrice } from '../../../shared/format';
import { FilterChip, RadioGroup, RangeSlider, type RadioOption } from '../../../shared/ui';
import { makeStyles, useTheme } from '../../../theme';
import { useFavoriteIds } from '../../favorites/favoritesStore';
import {
  DEFAULT_FILTERS,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  RADIUS_OPTIONS,
  applyClientFilters,
  buildSearchRequest,
  countMasters,
  type SearchFilters,
  type SortBy,
} from '../searchFilters';
import { CategoryAccordion } from './CategoryAccordion';

const SORT_OPTIONS: readonly RadioOption<SortBy>[] = [
  { value: 'geo_distance', label: 'Closest to me' },
  { value: 'rating_desc', label: 'Highest rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

interface FiltersSheetProps {
  visible: boolean;
  value: SearchFilters;
  /** Current text query and search center — used for the live "Show N masters" count. */
  query: string;
  center: LngLat;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
}

export function FiltersSheet({ visible, value, query, center, onApply, onClose }: FiltersSheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const favoriteIds = useFavoriteIds();
  const [draft, setDraft] = useState(value);

  // Start from the applied filters every time the sheet opens.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  // Preview count for the CTA. Same query key as the screen, so an unchanged
  // draft is served from cache; price/favorites are applied client-side.
  const request = useMemo(
    () => (visible ? buildSearchRequest(draft, query, center) : null),
    [visible, draft, query, center],
  );
  const preview = useMasterSearch(request);
  const count = preview.data ? countMasters(applyClientFilters(preview.data, draft, favoriteIds)) : null;
  const ctaLabel =
    count === null
      ? 'Apply filters'
      : count === 0
        ? 'No masters found'
        : `Show ${count} master${count === 1 ? '' : 's'}`;

  const update = (patch: Partial<SearchFilters>) => setDraft(d => ({ ...d, ...patch }));
  const toggleService = (id: string) =>
    setDraft(d => ({
      ...d,
      categoryIds: d.categoryIds.includes(id) ? d.categoryIds.filter(c => c !== id) : [...d.categoryIds, id],
    }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { top: insets.top + 24 }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <X size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Filters
          </Text>
          <Pressable
            onPress={() => setDraft(DEFAULT_FILTERS)}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={styles.reset}>Reset all</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Sort by">
            <RadioGroup
              value={draft.sortBy}
              options={SORT_OPTIONS}
              onChange={sortBy => update({ sortBy })}
              accessibilityLabel="Sort by"
            />
          </Section>

          <Section title="Price">
            <Text style={styles.priceRange}>
              {formatPrice(draft.priceMin)} — {formatPrice(draft.priceMax)}
            </Text>
            <RangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={[draft.priceMin, draft.priceMax]}
              onChange={([priceMin, priceMax]) => update({ priceMin, priceMax })}
              labels={['Minimum price', 'Maximum price']}
            />
            <View style={styles.priceBounds}>
              <Text style={styles.priceBound}>{formatPrice(PRICE_MIN)}</Text>
              <Text style={styles.priceBound}>{formatPrice(PRICE_MAX)}</Text>
            </View>
          </Section>

          <Section title="Search radius">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              accessibilityRole="radiogroup"
            >
              {RADIUS_OPTIONS.map(radius => (
                <FilterChip
                  key={radius}
                  label={`${radius / 1000} km`}
                  selected={draft.radiusMeters === radius}
                  onPress={() => update({ radiusMeters: radius })}
                />
              ))}
            </ScrollView>
          </Section>

          <Section title="Categories">
            <CategoryAccordion selected={draft.categoryIds} onToggle={toggleService} />
          </Section>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Favorite masters only</Text>
            <Switch
              value={draft.favoritesOnly}
              onValueChange={favoritesOnly => update({ favoritesOnly })}
              trackColor={{ true: colors.primary, false: colors.surfaceVariant }}
              thumbColor={colors.text}
              accessibilityLabel="Favorite masters only"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <Pressable
            onPress={() => onApply(draft)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 9,
    borderTopLeftRadius: t.radii.xxl,
    borderTopRightRadius: t.radii.xxl,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.card,
    boxShadow: '0px -12px 36px 0px rgba(0, 0, 0, 0.65)',
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(53, 52, 56, 0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.sm,
  },
  close: {
    width: t.sizes.iconButtonLg,
    height: t.sizes.iconButtonLg,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  resetButton: {
    minHeight: t.sizes.touch,
    justifyContent: 'center',
  },
  reset: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
  pressed: { opacity: t.opacity.pressed },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: t.spacing.xl,
    paddingBottom: t.spacing.xl,
  },
  section: {
    marginTop: t.spacing.lg,
  },
  sectionTitle: {
    ...t.typography.overline,
    marginBottom: t.spacing.sm,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },
  priceRange: {
    marginBottom: t.spacing.md,
    fontFamily: t.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  priceBounds: {
    marginTop: t.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceBound: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  chips: {
    gap: t.spacing.sm,
  },
  switchRow: {
    marginTop: t.spacing.xl,
    minHeight: t.sizes.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontFamily: t.fontFamily.regular,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  footer: {
    paddingTop: t.spacing.md,
    paddingHorizontal: t.spacing.xl,
    backgroundColor: t.colors.card,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: t.colors.borderSubtle,
  },
  cta: {
    paddingVertical: t.spacing.lg,
    borderRadius: t.radii.lg,
    alignItems: 'center',
    backgroundColor: t.colors.primary,
    boxShadow: '0px 8px 16px 0px rgba(232, 180, 160, 0.15)',
  },
  ctaLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.onPrimary,
  },
}));

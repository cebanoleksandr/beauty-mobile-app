/**
 * Catalog categories (`GET /api/catalog`); tapping one expands its services
 * as checkboxes. Selected *service* ids drive the search. Port of the web
 * app's CategoryAccordion.
 */
import {
  Camera,
  Car,
  ChevronDown,
  Dumbbell,
  Eye,
  GraduationCap,
  Hand,
  HeartPulse,
  Home,
  Palette,
  PawPrint,
  Scissors,
  Sparkles,
  Tag,
  Video,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translations } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { useCatalog } from '../../../query';
import { Checkbox } from '../../../shared/ui';
import { useTranslation } from '../../../i18n';
import { makeStyles, useTheme } from '../../../theme';

// Catalog rows carry no icon; pick one from the English name (same table as the web app).
const ICONS: readonly [RegExp, LucideIcon][] = [
  [/auto|car/i, Car],
  [/barber|hair/i, Scissors],
  [/brow|lash/i, Eye],
  [/nail|mani|pedi/i, Hand],
  [/video/i, Video],
  [/photo/i, Camera],
  [/make.?up|cosmet|skin|face/i, Palette],
  [/massage|spa|health/i, HeartPulse],
  [/fitness|sport|gym/i, Dumbbell],
  [/tutor|lesson|educat/i, GraduationCap],
  [/pet|groom/i, PawPrint],
  [/repair|handyman/i, Wrench],
  [/clean|home/i, Home],
  [/beauty/i, Sparkles],
];

function categoryIcon(name: Translations): LucideIcon {
  const key = name.en ?? Object.values(name)[0] ?? '';
  return ICONS.find(([re]) => re.test(key))?.[1] ?? Tag;
}

interface CategoryAccordionProps {
  selected: readonly string[];
  onToggle: (serviceId: string) => void;
}

export function CategoryAccordion({ selected, onToggle }: CategoryAccordionProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tr = useTranslate();
  const { data: categories = [], isLoading, isError, refetch } = useCatalog();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={styles.skeletons}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  if (isError || categories.length === 0) {
    return (
      <Pressable onPress={() => refetch()} accessibilityRole="button">
        <Text style={styles.empty}>
          {t('discover.categoriesUnavailable')}
          {isError ? t('discover.tapToRetry') : ''}
        </Text>
      </Pressable>
    );
  }

  return (
    <View>
      {categories.map((category, index) => {
        const open = expanded === category.id;
        const Icon = categoryIcon(category.name);
        const selectedCount = category.definitions.filter(d => selected.includes(d.id)).length;
        const last = index === categories.length - 1;
        return (
          <View key={category.id} style={!last && styles.divider}>
            <Pressable
              onPress={() => setExpanded(open ? null : category.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              style={({ pressed }) => [styles.header, pressed && styles.pressed]}
            >
              <View style={styles.iconBox}>
                <Icon size={20} color={colors.primary} strokeWidth={1.75} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {tr(category.name)}
              </Text>
              {selectedCount > 0 && (
                <View style={styles.count}>
                  <Text style={styles.countText}>{selectedCount}</Text>
                </View>
              )}
              <ChevronDown size={18} color={colors.textSecondary} style={open ? styles.chevronOpen : undefined} />
            </Pressable>
            {open && (
              <View style={styles.services}>
                {category.definitions.map(def => (
                  <Checkbox
                    key={def.id}
                    checked={selected.includes(def.id)}
                    onChange={() => onToggle(def.id)}
                    label={tr(def.name)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  skeletons: { gap: t.spacing.sm },
  skeleton: {
    height: 56,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.cardInner,
  },
  empty: {
    ...t.typography.bodyMedium,
    paddingVertical: t.spacing.md,
    color: t.colors.textSecondary,
  },
  divider: {
    borderBottomWidth: t.borderWidth.thin,
    borderBottomColor: t.colors.borderSubtle,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  pressed: { opacity: t.opacity.pressed },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.25)',
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontFamily: t.fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 11,
    lineHeight: 14,
    color: t.colors.onPrimary,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  services: {
    paddingLeft: 56,
    paddingBottom: t.spacing.sm,
  },
}));

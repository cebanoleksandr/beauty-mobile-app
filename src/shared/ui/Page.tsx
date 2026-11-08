/**
 * Building blocks for list screens, matching My Bookings / Settings:
 * large page title, uppercase section labels, dark cards, segmented tabs,
 * avatars with an initials fallback and loading / error / empty states.
 */
import type { LucideIcon } from 'lucide-react-native';
import { Star } from 'lucide-react-native';
import React, { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.titleRow}>
      <View style={styles.flex}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
  highlight,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
}) {
  const styles = useStyles();
  return <View style={[styles.card, highlight && styles.cardHighlight, style]}>{children}</View>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.segments} accessibilityRole="tablist">
      {options.map(o => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({
  uri,
  name,
  size = 48,
  rating,
  onPress,
}: {
  uri?: string | null;
  name: string;
  size?: number;
  rating?: number | null;
  onPress?: () => void;
}) {
  const styles = useStyles();
  const [failed, setFailed] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
  const body = (
    <View style={[styles.avatar, { width: size, height: size }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={styles.avatarImage} onError={() => setFailed(true)} />
      ) : (
        <Text style={[styles.avatarInitials, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
      )}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? name : undefined}
      style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}
    >
      {body}
      {rating != null && rating > 0 && (
        <View style={styles.ratingBadge}>
          <Star size={9} color="#FBBF24" fill="#FBBF24" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function LoadingState() {
  const styles = useStyles();
  const { colors } = useTheme();
  return <ActivityIndicator color={colors.primary} style={styles.state} />;
}

export function ErrorState({ text, onRetry }: { text?: string; onRetry: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <Pressable onPress={onRetry} accessibilityRole="button" style={styles.state}>
      <Text style={styles.link}>{text ?? t('common.loadError')}</Text>
    </Pressable>
  );
}

export function EmptyState({
  Icon,
  title,
  text,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon size={22} color={colors.primary} strokeWidth={1.75} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!text && <Text style={styles.emptyText}>{text}</Text>}
      {action}
    </View>
  );
}

/** Small rounded label ("New", "Loyal", "Banned"). */
export function Tag({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: 'primary' | 'success' | 'danger' | 'muted' | 'secondary';
}) {
  const styles = useStyles();
  return (
    <View style={[styles.tag, styles[`tag_${tone}` as const]]}>
      <Text style={[styles.tagText, styles[`tagText_${tone}` as const]]}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  pressed: { opacity: t.opacity.pressed },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: t.spacing.md,
  },
  title: {
    fontFamily: t.fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: '#FFFFFF',
  },
  subtitle: {
    ...t.typography.bodySmall,
    marginTop: 2,
    color: t.colors.textSecondary,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xs,
  },
  section: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    color: t.colors.textAccent,
  },
  card: {
    padding: t.spacing.lg,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  cardHighlight: {
    borderColor: 'rgba(232, 180, 160, 0.4)',
    boxShadow: '0px 4px 16px 0px rgba(232, 180, 160, 0.1)',
  },
  segments: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: t.colors.card,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.xs,
    borderRadius: t.radii.md,
  },
  segmentActive: {
    backgroundColor: t.colors.buttonNeutral,
    boxShadow: '0px 2px 6px 0px rgba(232, 180, 160, 0.12)',
  },
  segmentLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textAccent,
  },
  segmentLabelActive: { color: t.colors.primary },
  avatarWrap: { borderRadius: t.radii.full },
  avatar: {
    borderRadius: t.radii.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.25)',
    backgroundColor: t.colors.cardInner,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: {
    fontFamily: t.fontFamily.semibold,
    color: t.colors.textAccent,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.background,
  },
  ratingText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 9,
    lineHeight: 12,
    color: t.colors.text,
  },
  state: { marginTop: t.spacing.xxl, alignSelf: 'center' },
  link: { ...t.typography.labelLarge, color: t.colors.primary },
  empty: {
    alignItems: 'center',
    gap: t.spacing.md,
    paddingTop: 29,
    paddingBottom: 21,
    paddingHorizontal: 21,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundImage: `linear-gradient(to bottom, rgba(42, 42, 45, 0.4) 0%, ${t.colors.card} 100%)`,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.2)',
    backgroundColor: 'rgba(232, 180, 160, 0.1)',
    boxShadow: '0px 0px 24px 0px rgba(232, 180, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  emptyText: {
    ...t.typography.bodySmall,
    maxWidth: 300,
    marginTop: -6,
    textAlign: 'center',
    color: t.colors.textAccent,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
  },
  tag_primary: {
    borderColor: 'rgba(232, 180, 160, 0.3)',
    backgroundColor: 'rgba(232, 180, 160, 0.12)',
  },
  tag_secondary: {
    borderColor: 'rgba(206, 189, 255, 0.25)',
    backgroundColor: 'rgba(80, 40, 174, 0.25)',
  },
  tag_success: {
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(2, 44, 34, 0.6)',
  },
  tag_danger: {
    borderColor: 'rgba(242, 184, 181, 0.2)',
    backgroundColor: 'rgba(96, 20, 16, 0.4)',
  },
  tag_muted: {
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(42, 42, 45, 0.6)',
  },
  tagText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tagText_primary: { color: t.colors.primary },
  tagText_secondary: { color: '#CEBDFF' },
  tagText_success: { color: t.colors.success },
  tagText_danger: { color: '#F2B8B5' },
  tagText_muted: { color: t.colors.textSecondary },
}));

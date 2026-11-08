import React, { type FC } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import CheckIcon from '../../assets/icons/check.svg';
import CheckUnselectedIcon from '../../assets/icons/check-unselected.svg';
import { AmbientGlow } from '../../shared/ui';
import { makeStyles, useTheme } from '../../theme';

export interface RoleFeature {
  Icon: FC<SvgProps>;
  text: string;
}

interface RoleCardProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeTone: 'primary' | 'secondary';
  Icon: FC<SvgProps>;
  features: RoleFeature[];
  selected: boolean;
  onSelect: () => void;
}

/** Selectable account-type card (radio). Figma nodes 7:1917 / 7:1956. */
export function RoleCard({ title, subtitle, badge, badgeTone, Icon, features, selected, onSelect }: RoleCardProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const badgeBg = badgeTone === 'primary' ? colors.primaryBadge : colors.secondaryBadge;
  const badgeFg = badgeTone === 'primary' ? colors.onPrimaryBadge : colors.onSecondaryBadge;

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${subtitle}`}
      style={[styles.card, selected ? styles.cardSelected : styles.cardIdle]}
    >
      {selected && (
        <AmbientGlow size={208} color="rgba(232, 180, 160, 0.1)" style={styles.glow} />
      )}

      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={[styles.iconVessel, selected ? styles.iconVesselSelected : styles.iconVesselIdle]}>
            <Icon />
          </View>
          <View style={styles.titles}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeFg }]}>{badge}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View style={[styles.radio, selected ? styles.radioSelected : styles.radioIdle]}>
          {selected ? <CheckIcon /> : <CheckUnselectedIcon />}
        </View>
      </View>

      <View style={styles.features}>
        {features.map(({ Icon: FeatureIcon, text }) => (
          <View key={text} style={styles.feature}>
            <FeatureIcon />
            <Text style={styles.featureText}>{text}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  card: {
    backgroundColor: t.colors.card,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    padding: t.spacing.xl,
    gap: t.spacing.lg,
    overflow: 'hidden',
  },
  cardIdle: {
    borderColor: t.colors.borderSubtle,
  },
  cardSelected: {
    borderColor: t.colors.primary,
    boxShadow: `0px 12px 36px 0px rgba(232, 180, 160, 0.12), inset 0px 0px 0px 2px ${t.colors.primary}`,
  },
  glow: {
    top: -72,
    right: -72,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  iconVessel: {
    width: 48,
    height: 48,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0px 2px 4px 0px rgba(0, 0, 0, 0.05)',
  },
  iconVesselSelected: { borderColor: 'rgba(232, 180, 160, 0.4)' },
  iconVesselIdle: { borderColor: 'rgba(255, 255, 255, 0.08)' },
  titles: {
    marginLeft: 14,
    gap: t.spacing.xxs,
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  badge: {
    marginLeft: t.spacing.sm,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: t.spacing.xxs,
    borderRadius: t.radii.full,
  },
  badgeText: {
    fontFamily: t.fontFamily.regular,
    fontSize: 9,
    lineHeight: 13.5,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...t.typography.bodySmall,
    color: t.colors.textAccent,
  },
  radio: {
    marginTop: t.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: t.colors.primary,
  },
  radioIdle: {
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(157, 141, 136, 0.5)',
  },
  features: {
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: t.colors.borderSubtle,
    paddingTop: t.spacing.lg,
    gap: t.spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    ...t.typography.bodySmall,
    marginLeft: t.spacing.sm,
    color: t.colors.textSecondary,
    flexShrink: 1,
  },
}));

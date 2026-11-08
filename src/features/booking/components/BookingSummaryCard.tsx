/**
 * Master + selected service. Figma node 7:987, without the studio location
 * line (no address in the backend).
 */
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import ClockIcon from '../../../assets/icons/booking/clock.svg';
import StarIcon from '../../../assets/icons/booking/star.svg';
import VerifiedSmall from '../../../assets/icons/booking/verified-small.svg';
import { resolveApiUrl, type MasterDetailDto, type MasterServiceDto } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { formatPrice, formatRating } from '../../../shared/format';
import { AmbientGlow } from '../../../shared/ui';
import { makeStyles } from '../../../theme';
import { formatDuration } from '../../master-profile/profileFormat';

interface BookingSummaryCardProps {
  master: MasterDetailDto;
  service: MasterServiceDto;
  /** Hidden when the master has a single service. */
  onChangeService?: () => void;
}

export function BookingSummaryCard({ master, service, onChangeService }: BookingSummaryCardProps) {
  const styles = useStyles();
  const tr = useTranslate();
  const avatar = resolveApiUrl(master.avatarUrl);
  const rating = formatRating(master.rating);

  return (
    <View style={styles.card}>
      <AmbientGlow size={224} color="rgba(232, 180, 160, 0.1)" style={styles.glow} />

      <View style={styles.masterRow}>
        <View>
          <View style={styles.avatar}>{avatar && <Image source={{ uri: avatar }} style={styles.avatarImage} />}</View>
          {master.verified && (
            <View style={styles.verified} accessibilityLabel="Verified master">
              <VerifiedSmall />
            </View>
          )}
        </View>
        <View style={styles.masterText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {master.displayName}
            </Text>
            {rating && (
              <View style={styles.ratingPill}>
                <StarIcon />
                <Text style={styles.ratingText}>{rating}</Text>
              </View>
            )}
          </View>
          {!!tr(master.title) && <Text style={styles.subtitle}>{tr(master.title)}</Text>}
        </View>
      </View>

      <View style={styles.serviceRow}>
        <View style={styles.serviceInfo}>
          <Text style={styles.overline}>Selected service</Text>
          <Text style={styles.serviceName}>{tr(service.name)}</Text>
          <View style={styles.serviceMeta}>
            <ClockIcon />
            <Text style={styles.metaText}>{formatDuration(service.durationMinutes)}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaPrice}>{formatPrice(service.price)}</Text>
          </View>
        </View>
        {onChangeService && (
          <Pressable onPress={onChangeService} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  card: {
    padding: 17,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.cardInner,
    boxShadow: '0px 8px 32px 0px rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
  },
  glow: { top: -80, right: -80 },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: t.borderWidth.thin,
    borderBottomColor: t.colors.borderSubtle,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: t.radii.full,
    overflow: 'hidden',
    backgroundColor: t.colors.card,
    boxShadow: '0px 0px 0px 2px rgba(232, 180, 160, 0.7), 0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  avatarImage: { width: '100%', height: '100%' },
  verified: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterText: {
    flex: 1,
    paddingLeft: 14,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(14, 14, 17, 0.8)',
  },
  ratingText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.text,
  },
  subtitle: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  serviceRow: {
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    paddingTop: t.spacing.sm,
    gap: t.spacing.xs,
  },
  overline: {
    ...t.typography.overline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#CEBDFF',
  },
  serviceName: {
    paddingTop: 2,
    fontFamily: t.fontFamily.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  metaText: {
    ...t.typography.bodySmall,
    marginRight: t.spacing.xs,
    color: t.colors.textSecondary,
  },
  metaPrice: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: t.colors.primary,
  },
  change: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.primary,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(232, 180, 160, 0.4)',
  },
}));

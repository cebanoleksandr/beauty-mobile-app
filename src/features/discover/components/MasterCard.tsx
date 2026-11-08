/**
 * Vertical master card for the map carousel / list.
 * Layout follows the product screenshot (photo on top, bookmark, name,
 * category, rating · distance, price, full-width "Book"); colours, type and
 * the selected state come from Figma node 7:496.
 */
import React, { memo } from 'react';
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import BookmarkIcon from '../../../assets/icons/bookmark.svg';
import BookmarkFilledIcon from '../../../assets/icons/custom/bookmark-filled.svg';
import StarIcon from '../../../assets/icons/star.svg';
import PersonIcon from '../../../assets/icons/tab-profile.svg';
import { resolveApiUrl, type MasterCardDto } from '../../../api';
import { useTranslate } from '../../../i18n/language';
import { formatDistance, formatPrice, formatRating } from '../../../shared/format';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';

export const MASTER_CARD_WIDTH = 156;

interface MasterCardProps {
  master: MasterCardDto;
  selected: boolean;
  favorite: boolean;
  onPress: (master: MasterCardDto) => void;
  onToggleFavorite: (master: MasterCardDto) => void;
  onBook: (master: MasterCardDto) => void;
  style?: StyleProp<ViewStyle>;
}

export const MasterCard = memo(function MasterCardView({
  master,
  selected,
  favorite,
  onPress,
  onToggleFavorite,
  onBook,
  style,
}: MasterCardProps) {
  const styles = useStyles();
  const tr = useTranslate();
  const { t } = useTranslation();
  const avatar = resolveApiUrl(master.avatarUrl);
  const rating = formatRating(master.rating);
  const distance = formatDistance(master.distanceMeters);
  const category = tr(master.category) || tr(master.services[0]);

  return (
    <Pressable
      onPress={() => onPress(master)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${master.displayName}${category ? `, ${category}` : ''}`}
      style={[styles.card, selected && styles.cardSelected, style]}
    >
      <View style={styles.photo}>
        {avatar ? <Image source={{ uri: avatar }} style={styles.photoImage} /> : <PersonIcon />}
        <Pressable
          onPress={() => onToggleFavorite(master)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: favorite }}
          accessibilityLabel={favorite ? t('discover.card.removeFavorite') : t('discover.card.addFavorite')}
          style={styles.favorite}
        >
          {favorite ? <BookmarkFilledIcon /> : <BookmarkIcon />}
        </Pressable>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {master.displayName}
      </Text>
      {!!category && (
        <Text style={styles.category} numberOfLines={1}>
          {category}
        </Text>
      )}

      <View style={styles.meta}>
        {rating && (
          <View style={styles.rating}>
            <StarIcon />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        )}
        {rating && distance && <Text style={styles.dot}>•</Text>}
        {distance && <Text style={styles.metaText}>{distance}</Text>}
      </View>

      <Text style={styles.priceRow} numberOfLines={1}>
        <Text style={styles.priceFrom}>{t('discover.card.from')}</Text>
        <Text style={styles.price}>{formatPrice(master.startingPrice)}</Text>
      </Text>

      <Pressable
        onPress={() => onBook(master)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.book,
          selected ? styles.bookPrimary : styles.bookNeutral,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.bookLabel, selected && styles.bookLabelPrimary]}>{t('discover.card.book')}</Text>
      </Pressable>
    </Pressable>
  );
});

const useStyles = makeStyles(t => ({
  card: {
    width: MASTER_CARD_WIDTH,
    padding: t.spacing.md,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.glass,
  },
  cardSelected: {
    borderColor: 'rgba(232, 180, 160, 0.4)',
    boxShadow: '0px 0px 0px 1px rgba(232, 180, 160, 0.2), 0px 8px 32px 0px rgba(232, 180, 160, 0.15)',
  },
  photo: {
    height: 96,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorder,
    backgroundColor: t.colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  favorite: {
    position: 'absolute',
    top: t.spacing.xs,
    right: t.spacing.xs,
    width: 28,
    height: 28,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(14, 14, 17, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 10,
    fontFamily: t.fontFamily.bold,
    fontSize: 16,
    lineHeight: 20,
    color: t.colors.text,
  },
  category: {
    ...t.typography.bodySmall,
    color: t.colors.textAccent,
  },
  meta: {
    marginTop: t.spacing.xs,
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
  },
  ratingText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.text,
  },
  dot: {
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(157, 141, 136, 0.4)',
  },
  metaText: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  priceRow: {
    marginTop: 6,
  },
  priceFrom: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  price: {
    fontFamily: t.fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  book: {
    marginTop: 10,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radii.lg,
    alignItems: 'center',
  },
  bookPrimary: {
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 8px 0px rgba(232, 180, 160, 0.25)',
  },
  bookNeutral: {
    backgroundColor: t.colors.buttonNeutral,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
  },
  pressed: { opacity: t.opacity.pressed },
  bookLabel: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.text,
  },
  bookLabelPrimary: {
    color: t.colors.onPrimarySoft,
  },
}));

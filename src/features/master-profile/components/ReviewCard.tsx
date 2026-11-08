/**
 * One client review. Figma node 7:792. The design's "Booked <service>" line
 * isn't in the backend, so the row under the name shows the review's stars.
 * Reviews can only be left for a completed booking, hence "Verified appointment".
 */
import React from 'react';
import { Text, View } from 'react-native';
import ReviewStar from '../../../assets/icons/master/review-star.svg';
import VerifiedCheck from '../../../assets/icons/master/verified-check.svg';
import type { MasterReviewDto } from '../../../api';
import { makeStyles } from '../../../theme';
import { formatRelativeDate, initials } from '../profileFormat';

export function Stars({ rating }: { rating: number }) {
  const styles = useStyles();
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <View style={styles.stars} accessibilityLabel={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <View key={i} style={i < full ? undefined : styles.starOff}>
          <ReviewStar />
        </View>
      ))}
    </View>
  );
}

export function ReviewCard({ review }: { review: MasterReviewDto }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.author}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(review.author) || '?'}</Text>
          </View>
          <View style={styles.authorText}>
            <Text style={styles.name} numberOfLines={1}>
              {review.author}
            </Text>
            <Stars rating={review.rating} />
          </View>
        </View>
        <Text style={styles.date}>{formatRelativeDate(review.date)}</Text>
      </View>
      {!!review.text && <Text style={styles.text}>{review.text}</Text>}
      <View style={styles.footer}>
        <VerifiedCheck />
        <Text style={styles.footerText}>Verified appointment</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  stars: {
    flexDirection: 'row',
  },
  starOff: {
    opacity: 0.25,
  },
  card: {
    gap: t.spacing.md,
    padding: 17,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(206, 189, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    color: '#CEBDFF',
  },
  authorText: {
    flexShrink: 1,
    gap: 2,
  },
  name: {
    fontFamily: t.fontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.text,
  },
  date: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textSecondary,
  },
  text: {
    ...t.typography.bodySmall,
    lineHeight: 19.5,
    color: t.colors.textAccent,
  },
  footer: {
    paddingTop: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: '#CEBDFF',
  },
}));

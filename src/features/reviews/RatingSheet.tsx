/**
 * Rate the other party of a booking (`POST /api/reviews`) — the client rates
 * the master, the master rates the client. Re-submitting updates the review.
 * The optional complaint goes to the admin Reports tab (`reportMessage`).
 * Web counterpart: features/reviews/RatingModal.
 */
import { CircleCheck, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { resolveApiUrl, type BookingDetailResponse } from '../../api';
import { useCreateReview } from '../../query';
import { Avatar, BottomSheet, Button, Checkbox, TextField } from '../../shared/ui';
import { useTranslation } from '../../i18n';
import { makeStyles, useTheme } from '../../theme';

/** Statuses a review is accepted for (the service took place, or the client didn't show). */
export const RATEABLE_STATUSES: readonly BookingDetailResponse['status'][] = ['COMPLETED', 'MISSED'];

interface RatingSheetProps {
  /** `null` keeps the sheet closed. */
  booking: BookingDetailResponse | null;
  /** Who is being rated. */
  target: 'master' | 'client';
  onClose: () => void;
}

export function RatingSheet({ booking, target, onClose }: RatingSheetProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const createReview = useCreateReview();
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [reporting, setReporting] = useState(false);
  const [report, setReport] = useState('');
  const [done, setDone] = useState(false);

  const name = booking ? (target === 'master' ? booking.masterName : booking.clientName) : '';
  const avatar = booking ? (target === 'master' ? booking.masterAvatarUrl : booking.clientAvatarUrl) : null;

  // Seed from the existing review each time a booking's sheet opens.
  const seed = () => {
    const existingRating = target === 'master' ? booking?.clientReviewRating : booking?.masterReviewRating;
    const existingText = target === 'master' ? booking?.clientReviewText : booking?.masterReviewText;
    setRating(existingRating ?? 0);
    setText(existingText ?? '');
    setReporting(false);
    setReport('');
    setDone(false);
    createReview.reset();
  };

  const submit = () => {
    if (!booking || rating === 0) return;
    createReview.mutate(
      {
        bookingId: booking.id,
        rating,
        text: text.trim() || undefined,
        reportMessage: reporting ? report.trim() || undefined : undefined,
      },
      { onSuccess: () => setDone(true) },
    );
  };

  return (
    <BottomSheet
      visible={booking !== null}
      onClose={onClose}
      onShow={seed}
      title={done ? undefined : target === 'master' ? t('reviews.rateMaster') : t('reviews.rateClient')}
      footer={
        done ? (
          <Button label={t('reviews.close')} variant="secondary" onPress={onClose} />
        ) : (
          <Button
            label={t('reviews.submit')}
            onPress={submit}
            disabled={rating === 0}
            loading={createReview.isPending}
          />
        )
      }
    >
      {done ? (
        <View style={styles.done}>
          <CircleCheck size={48} color={colors.success} strokeWidth={1.5} />
          <Text style={styles.doneTitle}>{t('reviews.thanks')}</Text>
          <Text style={styles.doneText}>{t('reviews.thanksText')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.target}>
            <Avatar uri={resolveApiUrl(avatar)} name={name} size={56} />
            <Text style={styles.targetName}>{name}</Text>
          </View>

          <View
            style={styles.stars}
            accessibilityRole="adjustable"
            accessibilityLabel={t('reviews.ratingLabel', { rating })}
          >
            {[1, 2, 3, 4, 5].map(n => (
              <Pressable
                key={n}
                onPress={() => setRating(n)}
                accessibilityRole="button"
                accessibilityLabel={t('reviews.stars', { count: n })}
                hitSlop={4}
              >
                <Star
                  size={36}
                  strokeWidth={1.5}
                  color={rating >= n ? '#FBBF24' : colors.textSecondary}
                  fill={rating >= n ? '#FBBF24' : 'transparent'}
                />
              </Pressable>
            ))}
          </View>

          <TextField
            value={text}
            onChangeText={setText}
            placeholder={t('reviews.placeholder')}
            maxLength={2000}
            multiline
          />

          <View style={styles.report}>
            <Checkbox
              checked={reporting}
              onChange={() => setReporting(v => !v)}
              label={target === 'master' ? t('reviews.reportMaster') : t('reviews.reportClient')}
            />
            {reporting && (
              <TextField
                value={report}
                onChangeText={setReport}
                placeholder={t('reviews.reportPlaceholder')}
                maxLength={2000}
                multiline
              />
            )}
          </View>

          {createReview.isError && <Text style={styles.error}>{t('reviews.error')}</Text>}
        </>
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles(t => ({
  target: {
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  targetName: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: t.colors.text,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: t.spacing.sm,
    marginVertical: t.spacing.lg,
  },
  report: { marginTop: t.spacing.sm, gap: t.spacing.xs },
  error: {
    ...t.typography.bodySmall,
    marginTop: t.spacing.sm,
    color: '#F2B8B5',
  },
  done: {
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingVertical: t.spacing.xl,
  },
  doneTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.text,
  },
  doneText: {
    ...t.typography.bodySmall,
    textAlign: 'center',
    color: t.colors.textAccent,
  },
}));

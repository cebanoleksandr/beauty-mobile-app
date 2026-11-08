/**
 * Master profile. Figma: Masters → node 7:665, limited to what the backend
 * serves (`GET /api/masters/{id}`, `/availability`):
 *
 *  - kept: avatar, name, title, verified/"Top master", rating + review count,
 *    services (name, duration, price), portfolio photos, reviews, bio,
 *    Telegram DM (username), next free slot, starting price;
 *  - dropped (no backend data): cover photo, online status, experience /
 *    clients / brand metrics, studio address & hours, "Popular" badges,
 *    service descriptions, portfolio captions & categories, share link.
 *
 * Distance and the pin's coordinates come from the search card that opened
 * the profile (the detail endpoint doesn't return them).
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BookmarkIcon from '../../assets/icons/bookmark.svg';
import BookmarkFilledIcon from '../../assets/icons/custom/bookmark-filled.svg';
import ArrowRightIcon from '../../assets/icons/master/arrow-right.svg';
import BackIcon from '../../assets/icons/master/back.svg';
import CalendarIcon from '../../assets/icons/master/calendar.svg';
import DirectionsIcon from '../../assets/icons/master/directions.svg';
import LocationIcon from '../../assets/icons/master/location.svg';
import MessageIcon from '../../assets/icons/master/message.svg';
import StarIcon from '../../assets/icons/master/star.svg';
import VerifiedIcon from '../../assets/icons/master/verified.svg';
import { ApiError, resolveApiUrl, type MasterDetailDto, type MasterServiceDto } from '../../api';
import { useTranslate } from '../../i18n/language';
import { useMasterAvailability, useMasterDetail } from '../../query';
import { useMasterAvailabilityLive } from '../../realtime';
import { formatDistance, formatPrice, formatRating } from '../../shared/format';
import { openDirections } from '../../shared/openDirections';
import { AmbientGlow } from '../../shared/ui';
import { useTranslation } from '../../i18n';
import { makeStyles } from '../../theme';
import { favoritesStore, useFavoriteIds } from '../favorites/favoritesStore';
import { PortfolioGallery } from './components/PortfolioGallery';
import { ProfileTabs, type ProfileTab } from './components/ProfileTabs';
import { ReviewCard, Stars } from './components/ReviewCard';
import { ServiceRow } from './components/ServiceRow';
import { minPrice, nextSlotLabel } from './profileFormat';

export interface MasterPreview {
  distanceMeters?: number | null;
  lat?: number;
  lng?: number;
}

interface MasterProfileScreenProps {
  masterId: number;
  preview?: MasterPreview;
  onBack: () => void;
  /** Opens booking; `service` is the one selected on the profile, if any. */
  onBook: (master: MasterDetailDto, service: MasterServiceDto | null) => void;
}

type TabKey = 'portfolio' | 'services' | 'reviews' | 'about';

const HERO_HEIGHT = 320;
const HEADER_OVERLAP = 80;

export function MasterProfileScreen({ masterId, preview, onBack, onBook }: MasterProfileScreenProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const detail = useMasterDetail(masterId);
  const availability = useMasterAvailability(masterId);
  // Slots taken / opened by others show up without a refresh.
  useMasterAvailabilityLive(masterId);
  const favoriteIds = useFavoriteIds();
  const favorite = favoriteIds.has(masterId);

  return (
    <View style={styles.screen}>
      {detail.data ? (
        <ProfileContent
          master={detail.data}
          preview={preview}
          nextSlot={nextSlotLabel(availability.data)}
          onBook={onBook}
        />
      ) : (
        <View style={styles.center}>
          {detail.isError ? (
            <>
              <Text style={styles.stateTitle}>
                {detail.error instanceof ApiError && detail.error.isNotFound
                  ? t('profile.notFound')
                  : t('profile.loadError')}
              </Text>
              {!(detail.error instanceof ApiError && detail.error.isNotFound) && (
                <Pressable onPress={() => detail.refetch()} accessibilityRole="button">
                  <Text style={styles.retry}>{t('common.tryAgain')}</Text>
                </Pressable>
              )}
            </>
          ) : (
            <ActivityIndicator color={styles.retry.color} />
          )}
        </View>
      )}

      {/* Floating header actions */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]} pointerEvents="box-none">
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')} style={styles.glassButton}>
          <BackIcon />
        </Pressable>
        <Pressable
          onPress={() => favoritesStore.toggle(masterId)}
          accessibilityRole="button"
          accessibilityState={{ selected: favorite }}
          accessibilityLabel={favorite ? t('discover.card.removeFavorite') : t('discover.card.addFavorite')}
          style={styles.glassButton}
        >
          {favorite ? <BookmarkFilledIcon /> : <BookmarkIcon />}
        </Pressable>
      </View>
    </View>
  );
}

function ProfileContent({
  master,
  preview,
  nextSlot,
  onBook,
}: {
  master: MasterDetailDto;
  preview?: MasterPreview;
  nextSlot: string | null;
  onBook: (master: MasterDetailDto, service: MasterServiceDto | null) => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tr = useTranslate();
  const { t } = useTranslation();

  const tabs = useMemo(() => {
    const list: ProfileTab<TabKey>[] = [];
    if (master.portfolio.length)
      list.push({ key: 'portfolio', label: t('profile.tabs.portfolio', { count: master.portfolio.length }) });
    list.push({ key: 'services', label: t('profile.tabs.services', { count: master.services.length }) });
    list.push({ key: 'reviews', label: t('profile.tabs.reviews', { count: master.reviewCount }) });
    if (master.bio?.trim()) list.push({ key: 'about', label: t('profile.tabs.about') });
    return list;
  }, [master, t]);

  const [tab, setTab] = useState<TabKey>(tabs[0].key);
  const [selected, setSelected] = useState<MasterServiceDto | null>(null);

  const avatar = resolveApiUrl(master.avatarUrl);
  const rating = formatRating(master.rating);
  const distance = formatDistance(preview?.distanceMeters);
  const fromPrice = minPrice(master.services);
  const hasCoords = preview?.lat !== undefined && preview?.lng !== undefined;

  // Opens the booking screen; the service picked here (if any) comes preselected.
  const book = () => {
    if (!master.services.length) {
      Alert.alert(t('profile.noServicesTitle'), t('profile.noServicesText'));
      return;
    }
    onBook(master, selected);
  };

  const openTelegram = () => {
    if (master.username) Linking.openURL(`https://t.me/${master.username}`);
  };

  const showDirections = () => {
    if (!hasCoords) return;
    openDirections(preview!.lat!, preview!.lng!).catch(() =>
      Alert.alert(t('profile.mapsErrorTitle'), t('profile.mapsErrorText')),
    );
  };

  return (
    <>
      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* 0 — hero + identity */}
        <View>
          <View style={styles.hero}>
            {avatar && <Image source={{ uri: avatar }} style={styles.heroImage} blurRadius={30} />}
            <AmbientGlow size={420} color="rgba(232, 180, 160, 0.12)" style={styles.heroGlowA} />
            <AmbientGlow size={360} color="rgba(206, 189, 255, 0.1)" style={styles.heroGlowB} />
            <View style={styles.heroFade} />
          </View>

          <View style={styles.identity}>
            <View style={styles.avatarRow}>
              <View>
                <View style={styles.avatarGlow} />
                <View style={styles.avatarRing}>
                  <View style={styles.avatarInner}>
                    {avatar && <Image source={{ uri: avatar }} style={styles.avatarImage} />}
                  </View>
                </View>
              </View>
              {master.verified && (
                <View style={styles.topBadge}>
                  <View style={styles.topBadgeDot} />
                  <Text style={styles.topBadgeText}>{t('profile.topMaster')}</Text>
                </View>
              )}
            </View>

            <View style={styles.names}>
              <View style={styles.nameRow}>
                <Text style={styles.name} accessibilityRole="header">
                  {master.displayName}
                </Text>
                {master.verified && (
                  <View style={styles.verified} accessibilityLabel={t('profile.verified')}>
                    <View style={styles.verifiedBleed}>
                      <VerifiedIcon />
                    </View>
                  </View>
                )}
              </View>
              {!!tr(master.title) && <Text style={styles.title}>{tr(master.title)}</Text>}
              {distance && (
                <View style={styles.locationRow}>
                  <LocationIcon />
                  <Text style={styles.locationText}>{distance} away</Text>
                </View>
              )}
            </View>

            <View style={styles.metrics}>
              <Metric
                value={
                  <View style={styles.ratingValue}>
                    <StarIcon />
                    <Text style={styles.metricValue}>{rating ?? '—'}</Text>
                  </View>
                }
                label={t('profile.reviewsCount', { count: master.reviewCount })}
              />
              <Metric
                value={<Text style={styles.metricValue}>{master.services.length}</Text>}
                label={t('profile.services')}
                divider
              />
              {master.portfolio.length > 0 && (
                <Metric
                  value={<Text style={styles.metricValue}>{master.portfolio.length}</Text>}
                  label={t('profile.works')}
                  divider
                />
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={book}
                accessibilityRole="button"
                style={({ pressed }) => [styles.bookButton, pressed && styles.pressed]}
              >
                <CalendarIcon />
                <Text style={styles.bookLabel}>{t('profile.bookAppointment')}</Text>
              </Pressable>
              {!!master.username && (
                <Pressable
                  onPress={openTelegram}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.messageInTelegram', { name: master.displayName })}
                  style={({ pressed }) => [styles.squareButton, pressed && styles.pressed]}
                >
                  <MessageIcon />
                </Pressable>
              )}
              {hasCoords && (
                <Pressable
                  onPress={showDirections}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.directions')}
                  style={({ pressed }) => [styles.squareButton, pressed && styles.pressed]}
                >
                  <DirectionsIcon />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* 1 — sticky tabs */}
        <View style={styles.tabsWrap}>
          <ProfileTabs tabs={tabs} active={tab} onChange={setTab} />
        </View>

        {/* 2 — tab content */}
        <View style={styles.content}>
          {tab === 'portfolio' && <PortfolioGallery photos={master.portfolio} />}

          {tab === 'services' &&
            (master.services.length ? (
              <View style={styles.list}>
                {master.services.map(service => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    selected={selected?.id === service.id}
                    onSelect={s => setSelected(cur => (cur?.id === s.id ? null : s))}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>{t('profile.noServices')}</Text>
            ))}

          {tab === 'reviews' && (
            <View style={styles.list}>
              <View style={styles.reviewsHeader}>
                <View style={styles.reviewsSummary}>
                  <Text style={styles.sectionTitle}>{rating ?? '—'}</Text>
                  {master.rating !== null && <Stars rating={master.rating} />}
                </View>
                <Text style={styles.reviewsCount}>{t('profile.ratingsCount', { count: master.reviewCount })}</Text>
              </View>
              {master.reviews.length ? (
                master.reviews.map(review => <ReviewCard key={review.id} review={review} />)
              ) : (
                <Text style={styles.empty}>{t('profile.noReviews')}</Text>
              )}
            </View>
          )}

          {tab === 'about' && (
            <View style={styles.aboutCard}>
              <Text style={styles.about}>{master.bio}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky booking bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bottomInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel} numberOfLines={1}>
              {selected ? tr(selected.name) : t('profile.startingFrom')}
            </Text>
            <Text style={styles.priceValue}>{formatPrice(selected ? selected.price : fromPrice)}</Text>
          </View>
          {nextSlot && (
            <View style={styles.nextRow}>
              <View style={styles.nextDot} />
              <Text style={styles.nextText}>Next: {nextSlot}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={book}
          accessibilityRole="button"
          style={({ pressed }) => [styles.bookNow, pressed && styles.pressed]}
        >
          <Text style={styles.bookNowLabel}>{t('profile.bookNow')}</Text>
          <ArrowRightIcon />
        </Pressable>
      </View>
    </>
  );
}

function Metric({ value, label, divider }: { value: React.ReactNode; label: string; divider?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.metric, divider && styles.metricDivider]}>
      {value}
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
  },
  stateTitle: {
    ...t.typography.titleMedium,
    color: t.colors.text,
  },
  retry: {
    ...t.typography.labelLarge,
    color: t.colors.primary,
  },
  pressed: { opacity: t.opacity.pressed },

  // Header actions
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xl,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(14, 14, 17, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: t.colors.cardInner,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.45,
  },
  heroGlowA: { top: -140, left: -120 },
  heroGlowB: { top: -60, right: -140 },
  heroFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `linear-gradient(to top, ${t.colors.background} 0%, rgba(14, 14, 17, 0.4) 50%, rgba(14, 14, 17, 0) 100%)`,
  },

  // Identity
  identity: {
    marginTop: -HEADER_OVERLAP,
    paddingHorizontal: t.spacing.xl,
    gap: t.spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatarGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    opacity: 0.7,
    borderRadius: t.radii.full,
    backgroundImage:
      'radial-gradient(circle closest-side, rgba(232, 180, 160, 0.4) 0%, rgba(206, 189, 255, 0.25) 60%, transparent 100%)',
  },
  avatarRing: {
    width: 112,
    height: 112,
    padding: 2.5,
    borderRadius: t.radii.full,
    backgroundImage: 'linear-gradient(45deg, #E8B4A0 0%, #51443F 50%, #CEBDFF 100%)',
  },
  avatarInner: {
    flex: 1,
    borderRadius: t.radii.full,
    overflow: 'hidden',
    backgroundColor: t.colors.cardInner,
    boxShadow: `0px 0px 0px 2px ${t.colors.background}`,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  topBadge: {
    marginBottom: t.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(206, 189, 255, 0.3)',
    backgroundColor: 'rgba(206, 189, 255, 0.1)',
  },
  topBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: '#CEBDFF',
  },
  topBadgeText: {
    ...t.typography.overline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#CEBDFF',
  },
  names: {
    gap: t.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontFamily: t.fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: t.colors.text,
  },
  // The exported badge includes its drop shadow (60×59 around a 20×19 slot).
  verified: {
    width: 20.167,
    height: 19.25,
  },
  verifiedBleed: {
    position: 'absolute',
    left: -20,
    top: -20,
  },
  title: {
    fontFamily: t.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.primary,
  },
  locationRow: {
    paddingTop: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  locationText: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  metrics: {
    flexDirection: 'row',
    gap: t.spacing.sm,
    paddingTop: 17,
    paddingBottom: 13,
    paddingHorizontal: 13,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: 'rgba(27, 27, 30, 0.7)',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: t.spacing.xs,
  },
  metricDivider: {
    borderLeftWidth: t.borderWidth.thin,
    borderLeftColor: t.colors.borderSubtle,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
  },
  metricValue: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.text,
  },
  metricLabel: {
    ...t.typography.overline,
    marginTop: 2,
    letterSpacing: 0.5,
    color: t.colors.textSecondary,
  },
  actions: {
    paddingTop: t.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.sm,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 8px 12px 0px rgba(232, 180, 160, 0.22)',
  },
  bookLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.onPrimary,
  },
  squareButton: {
    width: 48,
    height: 48,
    borderRadius: t.radii.lg,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(42, 42, 45, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs + content
  tabsWrap: {
    marginTop: 28,
  },
  content: {
    paddingTop: 28,
    paddingHorizontal: t.spacing.xl,
  },
  list: {
    gap: 10,
  },
  empty: {
    ...t.typography.bodyMedium,
    paddingVertical: t.spacing.xl,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  sectionTitle: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    color: t.colors.text,
  },
  reviewsCount: {
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textSecondary,
  },
  aboutCard: {
    padding: 17,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  about: {
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: t.colors.textAccent,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: t.spacing.md,
    paddingTop: 13,
    paddingHorizontal: t.spacing.xl,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: 'rgba(81, 68, 63, 0.2)',
    backgroundColor: 'rgba(14, 14, 17, 0.9)',
    boxShadow: '0px -8px 32px 0px rgba(0, 0, 0, 0.6)',
  },
  bottomInfo: {
    flexShrink: 1,
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    ...t.typography.bodySmall,
    flexShrink: 1,
    color: t.colors.textSecondary,
  },
  priceValue: {
    fontFamily: t.fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.primary,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextDot: {
    width: 6,
    height: 6,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.success,
  },
  nextText: {
    fontFamily: t.fontFamily.medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textAccent,
  },
  bookNow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    paddingHorizontal: 28,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 4px 12px 0px rgba(232, 180, 160, 0.25)',
  },
  bookNowLabel: {
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: t.colors.onPrimary,
  },
}));

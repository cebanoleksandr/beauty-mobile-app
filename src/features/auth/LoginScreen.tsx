/**
 * Figma: Masters → "Mobile Viewport Frame" (node 7:1824).
 *
 * "Continue with Telegram" signs in through the bot: the app opens
 * t.me/<bot>?start=login_…, the user taps Start and "Confirm sign-in" in the
 * chat, and the app (polling meanwhile) receives its session — see useBotLogin.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import heroImage from '../../assets/images/login-hero.jpg';
import TelegramIcon from '../../assets/icons/telegram.svg';
import { TelegramNotInstalledError, useBotLogin } from '../../auth';
import { i18n, useTranslation } from '../../i18n';
import { ApiError, NetworkError } from '../../api';
import { links } from '../../config/links';
import { DotBadge } from '../../shared/ui';
import { makeStyles, useTheme } from '../../theme';

function signInErrorMessage(error: unknown): string {
  if (error instanceof TelegramNotInstalledError) return i18n.t('auth.errors.noTelegram');
  if (error instanceof ApiError && error.status === 503) return i18n.t('auth.errors.unavailable');
  if (error instanceof ApiError && error.isUnauthorized) return i18n.t('auth.errors.expired');
  if (error instanceof ApiError && error.isForbidden) return i18n.t('auth.errors.blocked');
  if (error instanceof NetworkError) return i18n.t('auth.errors.network');
  return i18n.t('auth.errors.generic');
}

export function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { state, start, cancel, openBot, checkNow } = useBotLogin();
  const busy = state.phase === 'starting';
  const failure = state.phase === 'error' ? state.error : null;

  useEffect(() => {
    if (failure) Alert.alert(t('auth.failedTitle'), signInErrorMessage(failure));
  }, [failure, t]);

  const openLink = (url: string | null) => url && Linking.openURL(url);

  return (
    <View style={styles.screen}>
      {/* Hero image with atmospheric fade into the background */}
      <View style={styles.hero}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroFade} />
        <View style={styles.heroTopVignette} />
        <DotBadge
          label={t('auth.badge')}
          gap={8}
          backgroundColor="rgba(14, 14, 17, 0.4)"
          borderColor="rgba(255, 255, 255, 0.05)"
          textColor={colors.primaryContainer}
          style={[styles.brandTag, { top: insets.top + 22 }]}
        />
      </View>

      {/* Content & authentication */}
      <View style={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
        <View style={styles.intro}>
          <Text style={styles.wordmark} accessibilityRole="header">
            {t('common.brand')}
          </Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          <Text style={styles.description}>{t('auth.description')}</Text>
        </View>

        <View style={styles.cta}>
          {state.phase === 'waiting' && (
            <View style={styles.waiting} accessibilityLiveRegion="polite">
              <View style={styles.waitingHeader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.waitingTitle}>{t('auth.waitingTitle')}</Text>
              </View>
              <Text style={styles.waitingStep}>{t('auth.waitingStep1')}</Text>
              <Text style={styles.waitingStep}>{t('auth.waitingStep2')}</Text>
              <View style={styles.waitingActions}>
                <Text
                  style={styles.waitingLink}
                  onPress={() =>
                    openBot(state.botUrl).catch(e => Alert.alert(t('auth.failedTitle'), signInErrorMessage(e)))
                  }
                  accessibilityRole="button"
                >
                  {t('auth.openTelegramAgain')}
                </Text>
                <Text style={styles.waitingLink} onPress={checkNow} accessibilityRole="button">
                  {t('auth.confirmed')}
                </Text>
                <Text style={styles.waitingCancel} onPress={cancel} accessibilityRole="button">
                  {t('common.cancel')}
                </Text>
              </View>
            </View>
          )}
          {state.phase === 'expired' && <Text style={styles.expired}>{t('auth.expired')}</Text>}
          <Pressable
            onPress={start}
            disabled={busy || state.phase === 'waiting'}
            accessibilityRole="button"
            accessibilityState={{ busy }}
            style={({ pressed }) => [
              styles.telegramButton,
              state.phase === 'waiting' && styles.dimmed,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.telegramIcon}>
              {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <TelegramIcon />}
            </View>
            <Text style={styles.telegramLabel}>{t('auth.continue')}</Text>
          </Pressable>

          <Text style={styles.legal}>
            {t('auth.legalPrefix')}{' '}
            <Text style={styles.legalLink} onPress={() => openLink(links.terms)}>
              {t('auth.terms')}
            </Text>{' '}
            {t('auth.and')}{' '}
            <Text style={styles.legalLink} onPress={() => openLink(links.privacyPolicy)}>
              {t('auth.privacy')}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  hero: {
    height: '58%',
    overflow: 'hidden',
  },
  // The design bleeds the photo slightly past the hero frame.
  heroImage: {
    position: 'absolute',
    top: -13,
    bottom: -13,
    left: -10,
    right: -10,
  },
  heroFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundImage: 'linear-gradient(to top, rgb(14, 14, 17) 0%, rgba(14, 14, 17, 0.6) 50%, rgba(14, 14, 17, 0) 100%)',
  },
  heroTopVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    backgroundImage: 'linear-gradient(to bottom, rgba(14, 14, 17, 0.8) 0%, rgba(14, 14, 17, 0) 100%)',
  },
  brandTag: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    marginTop: -24,
    paddingHorizontal: t.spacing.xl,
    justifyContent: 'space-between',
  },
  intro: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: t.fontFamily.extrabold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 3.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: t.colors.primaryContainer,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  tagline: {
    marginTop: t.spacing.md,
    fontFamily: t.fontFamily.medium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.45,
    textAlign: 'center',
    color: t.colors.text,
  },
  description: {
    ...t.typography.bodySmall,
    marginTop: t.spacing.lg,
    maxWidth: 280,
    paddingHorizontal: 18,
    lineHeight: 19.5,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  cta: {
    paddingTop: t.spacing.lg,
    gap: t.spacing.lg,
  },
  telegramButton: {
    height: 56,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 10px 30px -4px rgba(232, 180, 160, 0.35), 0px 4px 12px -2px rgba(232, 180, 160, 0.2)',
  },
  pressed: { opacity: t.opacity.pressed },
  dimmed: { opacity: 0.5 },
  waiting: {
    gap: t.spacing.xs,
    padding: t.spacing.lg,
    borderRadius: t.radii.xl,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.25)',
    backgroundColor: t.colors.card,
  },
  waitingHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.xs },
  waitingTitle: {
    flex: 1,
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  waitingStep: { ...t.typography.bodySmall, color: t.colors.textAccent },
  waitingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.lg, marginTop: t.spacing.sm },
  waitingLink: { ...t.typography.labelMedium, color: t.colors.primary },
  waitingCancel: { ...t.typography.labelMedium, color: t.colors.textSecondary },
  expired: { ...t.typography.bodySmall, textAlign: 'center', color: '#F2B8B5' },
  telegramIcon: {
    width: 28,
    height: 28,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.telegram,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6.5,
    paddingBottom: 5.5,
    paddingLeft: 5.5,
    paddingRight: 6.5,
  },
  telegramLabel: {
    marginLeft: t.spacing.md,
    fontFamily: t.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.background,
  },
  legal: {
    ...t.typography.bodySmall,
    lineHeight: 18,
    paddingHorizontal: t.spacing.lg,
    textAlign: 'center',
    color: 'rgba(157, 141, 136, 0.8)',
  },
  legalLink: {
    color: t.colors.textAccent,
    textDecorationLine: 'underline',
    textDecorationColor: '#51443F',
  },
}));

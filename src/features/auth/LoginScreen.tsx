/** Figma: Masters → "Mobile Viewport Frame" (node 7:1824). */
import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import heroImage from '../../assets/images/login-hero.jpg';
import TelegramIcon from '../../assets/icons/telegram.svg';
import { TelegramAuthUnavailableError, useTelegramSignIn } from '../../auth';
import { ApiError, NetworkError } from '../../api';
import { links } from '../../config/links';
import { DotBadge } from '../../shared/ui';
import { makeStyles, useTheme } from '../../theme';

function signInErrorMessage(error: unknown): string {
  if (error instanceof TelegramAuthUnavailableError) return error.message;
  if (error instanceof ApiError && error.isUnauthorized) return 'Telegram session expired. Please try again.';
  if (error instanceof ApiError && error.isForbidden) return 'This account has been blocked.';
  if (error instanceof NetworkError) return 'Could not reach the server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

export function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const signIn = useTelegramSignIn();

  const onContinue = () =>
    signIn.mutate(undefined, {
      onError: error => Alert.alert('Sign-in failed', signInErrorMessage(error)),
    });

  const openLink = (url: string | null) => url && Linking.openURL(url);

  return (
    <View style={styles.screen}>
      {/* Hero image with atmospheric fade into the background */}
      <View style={styles.hero}>
        <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroFade} />
        <View style={styles.heroTopVignette} />
        <DotBadge
          label="Haute Beauté Directory"
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
            MASTERS
          </Text>
          <Text style={styles.tagline}>Find your beauty master. Anywhere.</Text>
          <Text style={styles.description}>
            Curated hair stylists, colorists, nail artists & bespoke aesthetic rituals.
          </Text>
        </View>

        <View style={styles.cta}>
          <Pressable
            onPress={onContinue}
            disabled={signIn.isPending}
            accessibilityRole="button"
            accessibilityState={{ busy: signIn.isPending }}
            style={({ pressed }) => [styles.telegramButton, pressed && styles.pressed]}
          >
            <View style={styles.telegramIcon}>
              {signIn.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <TelegramIcon />
              )}
            </View>
            <Text style={styles.telegramLabel}>Continue with Telegram</Text>
          </Pressable>

          <Text style={styles.legal}>
            By continuing you agree to the{' '}
            <Text style={styles.legalLink} onPress={() => openLink(links.terms)}>
              Terms
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => openLink(links.privacyPolicy)}>
              Privacy Policy
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
    backgroundImage:
      'linear-gradient(to top, rgb(14, 14, 17) 0%, rgba(14, 14, 17, 0.6) 50%, rgba(14, 14, 17, 0) 100%)',
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

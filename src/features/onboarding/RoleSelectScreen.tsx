/** Figma: Masters → role selection, "STEP 1 OF 2" (node 7:1870). */
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';
import BrushIcon from '../../assets/icons/brush.svg';
import CalendarIcon from '../../assets/icons/calendar.svg';
import ChevronLeftIcon from '../../assets/icons/chevron-left.svg';
import ClockIcon from '../../assets/icons/clock.svg';
import CompassIcon from '../../assets/icons/compass.svg';
import GalleryIcon from '../../assets/icons/gallery.svg';
import HelpIcon from '../../assets/icons/help.svg';
import PaymentsIcon from '../../assets/icons/payments.svg';
import ScissorsIcon from '../../assets/icons/scissors.svg';
import SparklesIcon from '../../assets/icons/sparkles.svg';
import SwapIcon from '../../assets/icons/swap.svg';
import TelegramBadgeIcon from '../../assets/icons/telegram-badge.svg';
import VerifiedIcon from '../../assets/icons/verified.svg';
import { ApiError, resolveApiUrl, userService, type UserResponse } from '../../api';
import { useSignOut } from '../../auth';
import { useMe, useSwitchMode } from '../../query';
import { AmbientGlow, CircleIconButton, DotBadge } from '../../shared/ui';
import { makeStyles } from '../../theme';
import { RoleCard } from './RoleCard';

type Role = 'CLIENT' | 'MASTER';

interface RoleSelectScreenProps {
  /** Called once the chosen mode is saved on the backend. */
  onCompleted: (role: Role) => void;
  /** "I'm a master" without active services → master onboarding. */
  onBecomeMaster: () => void;
}

export function RoleSelectScreen({ onCompleted, onBecomeMaster }: RoleSelectScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const signOut = useSignOut();
  const switchMode = useSwitchMode();
  const [role, setRole] = useState<Role>(me?.context === 'MASTER' ? 'MASTER' : 'CLIENT');
  const [saving, setSaving] = useState(false);

  const onContinue = async () => {
    // MASTER mode needs a master profile with at least one active service —
    // the onboarding creates both and switches the mode itself.
    if (role === 'MASTER' && !me?.masterProfile) return onBecomeMaster();
    setSaving(true);
    try {
      await switchMode.mutateAsync(role);
      onCompleted(role);
    } catch (e) {
      if (role === 'MASTER' && e instanceof ApiError && e.status === 400) onBecomeMaster();
      else Alert.alert('Could not save your choice', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onHelp = () =>
    Alert.alert(
      'Choosing a role',
      'Clients find masters and book appointments. Masters publish services and manage their schedule. You can switch anytime in your profile.',
    );

  return (
    <View style={styles.screen}>
      <AmbientGlow size={624} color="rgba(232, 180, 160, 0.05)" style={styles.glowTop} />
      <AmbientGlow size={520} color="rgba(80, 40, 174, 0.1)" style={styles.glowBottom} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <CircleIconButton icon={<ChevronLeftIcon />} onPress={signOut} accessibilityLabel="Back to sign in" />
        <DotBadge label="Step 1 of 2" />
        <CircleIconButton icon={<HelpIcon />} onPress={onHelp} accessibilityLabel="Help" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {me && <GreetingBadge me={me} />}

        <View style={styles.titleBlock}>
          <Text style={styles.title} accessibilityRole="header">
            How will you use <Text style={styles.titleAccent}>Masters</Text>?
          </Text>
          <Text style={styles.lead}>
            Select your account type to personalize your experience. You can switch or add another role later
            in settings.
          </Text>
        </View>

        <View style={styles.cards} accessibilityRole="radiogroup">
          <RoleCard
            title="I'm a client"
            subtitle="Find masters & book appointments"
            badge="Default"
            badgeTone="primary"
            Icon={SparklesIcon}
            features={[
              { Icon: CompassIcon, text: 'Explore top stylists, estheticians & salons' },
              { Icon: ClockIcon, text: 'Instant priority booking & secure deposits' },
              { Icon: GalleryIcon, text: 'Verified editorial portfolios & client reviews' },
            ]}
            selected={role === 'CLIENT'}
            onSelect={() => setRole('CLIENT')}
          />
          <RoleCard
            title="I'm a master"
            subtitle="Showcase my work & get clients"
            badge="Artisan"
            badgeTone="secondary"
            Icon={ScissorsIcon}
            features={[
              { Icon: BrushIcon, text: 'Custom atelier portfolio & digital rate card' },
              { Icon: CalendarIcon, text: 'Dynamic schedule & private waitlist management' },
              { Icon: PaymentsIcon, text: 'Direct client payouts & revenue performance' },
            ]}
            selected={role === 'MASTER'}
            onSelect={() => setRole('MASTER')}
          />
        </View>

        <View style={styles.trust}>
          <SwapIcon />
          <Text style={styles.trustText}>Switch profiles seamlessly anytime with one tap</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
        <Pressable
          onPress={onContinue}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ busy: saving }}
          style={({ pressed }) => [styles.cta, (pressed || saving) && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>{role === 'CLIENT' ? 'Continue as Client' : 'Continue as Master'}</Text>
          <View style={styles.ctaIcon}>
            <ArrowRightIcon />
          </View>
        </Pressable>
        <Text style={styles.footnote}>You can change this anytime in your profile settings</Text>
      </View>
    </View>
  );
}

function GreetingBadge({ me }: { me: UserResponse }) {
  const styles = useStyles();
  const photo = resolveApiUrl(me.photoUrl) ?? userService.photoUrl(me.id);
  const name = me.firstName ?? me.username ?? '';

  return (
    <View style={styles.greeting}>
      <View style={styles.avatarRing}>
        <View style={styles.avatarInner}>
          <Image source={{ uri: photo }} style={styles.avatarImage} />
        </View>
        <View style={styles.telegramBadge}>
          <TelegramBadgeIcon />
        </View>
      </View>
      <View style={styles.greetingText}>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingName}>Welcome{name ? `, ${name}` : ''}</Text>
          <VerifiedIcon />
        </View>
        <Text style={styles.greetingStatus}>Telegram connected</Text>
      </View>
    </View>
  );
}

const FOOTER_SPACE = 149;

const useStyles = makeStyles(t => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  glowTop: {
    top: -120,
    alignSelf: 'center',
  },
  glowBottom: {
    right: -89,
    bottom: -20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xl,
    paddingBottom: t.spacing.sm,
  },
  scrollContent: {
    paddingTop: t.spacing.lg,
    paddingHorizontal: t.spacing.xl,
    paddingBottom: FOOTER_SPACE + t.spacing.xxl,
  },

  // Greeting
  greeting: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    marginBottom: t.spacing.xxl,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: t.colors.borderSubtle,
    backgroundColor: t.colors.card,
  },
  avatarRing: {
    width: t.sizes.avatar,
    height: t.sizes.avatar,
    borderRadius: t.radii.full,
    padding: 1.5,
    backgroundImage: 'linear-gradient(45deg, #E8B4A0 0%, #51443F 50%, #CEBDFF 100%)',
  },
  avatarInner: {
    flex: 1,
    borderRadius: t.radii.full,
    overflow: 'hidden',
    backgroundColor: t.colors.cardInner,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  telegramBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thick,
    borderColor: t.colors.background,
    backgroundColor: t.colors.telegramBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    marginLeft: 14,
    gap: t.spacing.xxs,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingName: {
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    lineHeight: 14,
    color: t.colors.text,
  },
  greetingStatus: {
    ...t.typography.overline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: t.colors.textSecondary,
  },

  // Title
  titleBlock: {
    gap: 7,
    marginBottom: t.spacing.xxxl,
  },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.7,
    color: t.colors.text,
  },
  titleAccent: {
    fontFamily: t.fontFamily.italic,
    color: t.colors.primary,
  },
  lead: {
    fontFamily: t.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22.75,
    color: t.colors.textAccent,
  },

  cards: {
    gap: t.spacing.lg,
  },

  trust: {
    marginTop: t.spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    marginLeft: t.spacing.sm,
    fontFamily: t.fontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.48,
    color: t.colors.textSecondary,
  },

  // Sticky footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 17,
    paddingHorizontal: t.spacing.xl,
    backgroundColor: 'rgba(14, 14, 17, 0.85)',
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xxl,
    paddingVertical: t.spacing.lg,
    borderRadius: t.radii.lg,
    backgroundColor: t.colors.primary,
    boxShadow: '0px 8px 16px 0px rgba(232, 180, 160, 0.15)',
  },
  pressed: { opacity: t.opacity.pressed },
  ctaLabel: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    color: t.colors.onPrimary,
  },
  ctaIcon: {
    marginLeft: t.spacing.sm,
  },
  footnote: {
    ...t.typography.overline,
    marginTop: t.spacing.md,
    letterSpacing: 0.5,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
}));

/**
 * Top app bar of the tab screens. Figma node 7:620 (logo, wordmark, notifications);
 * the logo is the app icon (assets/icon, scripts/generate-app-icons.py).
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BellIcon from '../../../assets/icons/bell.svg';
import AppLogo from '../../../assets/icons/app-logo.svg';
import { useTranslation } from '../../../i18n';
import { makeStyles } from '../../../theme';

export const HEADER_HEIGHT = 56;

export function DiscoverHeader({ onNotifications }: { onNotifications?: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top }]}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <AppLogo />
        </View>
        <Text style={styles.wordmark}>{t('common.brand')}</Text>
      </View>
      <Pressable
        onPress={onNotifications}
        disabled={!onNotifications}
        accessibilityRole="button"
        accessibilityLabel={t('discover.notifications')}
        style={styles.bell}
      >
        <BellIcon />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(t => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xl,
    // Same chrome as the bottom nav (Figma 7:630) — blends into the #0E0E11 screen background.
    backgroundColor: t.colors.chrome,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  // The icon's own rounded square (rx 120/512 of 32 pt), outlined so it reads on the dark chrome.
  logo: {
    borderRadius: 7.5,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.3)',
    overflow: 'hidden',
  },
  wordmark: {
    fontFamily: t.fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: t.colors.primaryContainer,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(42, 42, 45, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

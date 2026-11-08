/** Top app bar over the map. Figma node 7:620 (logo, wordmark, notifications). */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BellIcon from '../../../assets/icons/bell.svg';
import LogoIcon from '../../../assets/icons/logo.svg';
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
          <LogoIcon />
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
    backgroundColor: 'rgba(19, 19, 22, 0.8)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: t.radii.full,
    borderWidth: t.borderWidth.thin,
    borderColor: 'rgba(232, 180, 160, 0.4)',
    backgroundColor: t.colors.buttonNeutral,
    boxShadow: '0px 0px 0px 1px #353438',
    alignItems: 'center',
    justifyContent: 'center',
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

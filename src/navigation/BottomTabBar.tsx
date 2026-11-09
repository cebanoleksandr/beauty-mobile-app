/**
 * Bottom navigation. Figma nav 7:630 (active/inactive icons from 7:1430 and
 * 7:2233), minus "Home", with "Chats" replaced by "Favorites" (custom icon —
 * the design has none). Master / admin tab sets reuse the same bar with
 * lucide icons (the designs only cover client mode).
 */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../i18n';
import { makeStyles } from '../theme';

export interface TabSpec {
  /** i18n key of the label. */
  label: string;
  renderIcon: (focused: boolean) => ReactNode;
}

interface Props extends BottomTabBarProps {
  tabs: Record<string, TabSpec>;
  /** Red counters (pending requests etc.), keyed by route name. */
  badges?: Record<string, number | undefined>;
}

export function BottomTabBar({ state, navigation, tabs, badges }: Props) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        const label = t(tab.label);
        const focused = state.index === index;
        const badge = badges?.[route.name] ?? 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={badge ? t('nav.newCount', { label, count: badge }) : label}
            style={styles.item}
          >
            <View style={styles.iconBox}>
              {tab.renderIcon(focused)}
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
            {focused && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  bar: {
    flexDirection: 'row',
    paddingTop: t.spacing.sm,
    paddingHorizontal: t.spacing.lg,
    // Figma 7:630: rgba(14,14,17,0.85) + upward shadow, no top border.
    backgroundColor: t.colors.chrome,
    boxShadow: '0px -4px 24px 0px rgba(0, 0, 0, 0.4)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: t.spacing.xs,
  },
  iconBox: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: t.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    borderWidth: 1.5,
    borderColor: t.colors.background,
  },
  badgeText: {
    fontFamily: t.fontFamily.bold,
    fontSize: 9,
    lineHeight: 11,
    color: '#FFFFFF',
  },
  label: {
    marginTop: t.spacing.xxs,
    fontFamily: t.fontFamily.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: t.colors.textSecondary,
  },
  labelActive: {
    color: t.colors.primaryContainer,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: t.colors.primaryContainer,
  },
}));

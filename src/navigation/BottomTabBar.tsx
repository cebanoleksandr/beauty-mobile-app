/**
 * Bottom navigation. Figma nav 7:630 (active/inactive icons from 7:1430 and
 * 7:2233), minus "Home", with "Chats" replaced by "Favorites" (custom icon —
 * the design has none).
 */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { type FC } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabBookingsActive from '../assets/icons/tab-bookings-active.svg';
import TabBookings from '../assets/icons/tab-bookings.svg';
import TabFavoritesActive from '../assets/icons/custom/tab-favorites-active.svg';
import TabFavorites from '../assets/icons/custom/tab-favorites.svg';
import TabMapActive from '../assets/icons/tab-map-active.svg';
import TabMap from '../assets/icons/tab-map.svg';
import TabProfileActive from '../assets/icons/tab-profile-active.svg';
import TabProfile from '../assets/icons/tab-profile.svg';
import { makeStyles } from '../theme';
import type { MainTabParamList } from './types';

const TABS: Record<keyof MainTabParamList, { label: string; Icon: FC<SvgProps>; ActiveIcon: FC<SvgProps> }> = {
  Discover: { label: 'Map', Icon: TabMap, ActiveIcon: TabMapActive },
  Bookings: { label: 'Bookings', Icon: TabBookings, ActiveIcon: TabBookingsActive },
  Favorites: { label: 'Favorites', Icon: TabFavorites, ActiveIcon: TabFavoritesActive },
  Profile: { label: 'Profile', Icon: TabProfile, ActiveIcon: TabProfileActive },
};

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name as keyof MainTabParamList];
        const focused = state.index === index;
        const Icon = focused ? tab.ActiveIcon : tab.Icon;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            style={styles.item}
          >
            <View style={styles.iconBox}>
              <Icon />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
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
    backgroundColor: t.colors.chrome,
    borderTopWidth: t.borderWidth.thin,
    borderTopColor: 'rgba(81, 68, 63, 0.2)',
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

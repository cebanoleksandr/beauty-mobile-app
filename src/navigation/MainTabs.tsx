import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { BookingsScreen } from '../features/bookings/BookingsScreen';
import { MapSearchScreen } from '../features/discover/MapSearchScreen';
import { FavoritesScreen } from '../features/favorites/FavoritesScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { BottomTabBar } from './BottomTabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const renderTabBar = (props: React.ComponentProps<typeof BottomTabBar>) => <BottomTabBar {...props} />;

export function MainTabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Discover" component={MapSearchScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

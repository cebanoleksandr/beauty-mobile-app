import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { BookingsScreen } from '../features/bookings/BookingsScreen';
import { MapSearchScreen } from '../features/discover/MapSearchScreen';
import { FavoritesScreen } from '../features/favorites/FavoritesScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { BottomTabBar } from './BottomTabBar';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const renderTabBar = (props: React.ComponentProps<typeof BottomTabBar>) => <BottomTabBar {...props} />;

type DiscoverProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discover'>,
  NativeStackScreenProps<RootStackParamList>
>;

function DiscoverRoute({ navigation }: DiscoverProps) {
  return (
    <MapSearchScreen
      onOpenMaster={master =>
        navigation.navigate('MasterProfile', {
          masterId: master.id,
          preview: { distanceMeters: master.distanceMeters, lat: master.lat, lng: master.lng },
        })
      }
    />
  );
}

type BookingsProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Bookings'>,
  NativeStackScreenProps<RootStackParamList>
>;

function BookingsRoute({ navigation }: BookingsProps) {
  return (
    <BookingsScreen
      onOpenMaster={masterId => navigation.navigate('MasterProfile', { masterId })}
      onFindMaster={() => navigation.navigate('Discover')}
    />
  );
}

type ProfileProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

function SettingsRoute({ navigation }: ProfileProps) {
  return <SettingsScreen onOpenMasterProfile={masterId => navigation.navigate('MasterProfile', { masterId })} />;
}

export function MainTabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Discover" component={DiscoverRoute} />
      <Tab.Screen name="Bookings" component={BookingsRoute} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={SettingsRoute} />
    </Tab.Navigator>
  );
}

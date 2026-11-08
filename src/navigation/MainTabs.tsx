/**
 * The signed-in tab set for the active mode (`me.context`), like the web
 * app's client / master / admin areas. Switching mode in Profile swaps the
 * whole tab navigator (fresh state, mode-scoped lists).
 */
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  type BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Flag,
  type LucideIcon,
  NotebookTabs,
  Scissors,
  User,
  Users,
} from 'lucide-react-native';
import React, { type FC } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import TabBookingsActive from '../assets/icons/tab-bookings-active.svg';
import TabBookings from '../assets/icons/tab-bookings.svg';
import TabFavoritesActive from '../assets/icons/custom/tab-favorites-active.svg';
import TabFavorites from '../assets/icons/custom/tab-favorites.svg';
import TabMapActive from '../assets/icons/tab-map-active.svg';
import TabMap from '../assets/icons/tab-map.svg';
import TabProfileActive from '../assets/icons/tab-profile-active.svg';
import TabProfile from '../assets/icons/tab-profile.svg';
import { AdminReportsScreen } from '../features/admin/AdminReportsScreen';
import { AdminRequestsScreen } from '../features/admin/AdminRequestsScreen';
import { AdminStatsScreen } from '../features/admin/AdminStatsScreen';
import { AdminUsersScreen } from '../features/admin/AdminUsersScreen';
import { BookingsScreen } from '../features/bookings/BookingsScreen';
import { MapSearchScreen } from '../features/discover/MapSearchScreen';
import { FavoritesScreen } from '../features/favorites/FavoritesScreen';
import { MasterBookingsScreen, masterTabOf } from '../features/master/bookings/MasterBookingsScreen';
import { MasterCalendarScreen } from '../features/master/calendar/MasterCalendarScreen';
import { MasterClientsScreen } from '../features/master/clients/MasterClientsScreen';
import { MasterServicesScreen } from '../features/master/services/MasterServicesScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useAdminCatalogRequests, useAdminReports, useBookings, useMe } from '../query';
import { useTheme } from '../theme';
import { BottomTabBar, type TabSpec } from './BottomTabBar';
import type { AdminTabParamList, MainTabParamList, MasterTabParamList, RootStackParamList } from './types';

type BarProps = BottomTabBarProps;

const svgTab = (label: string, Icon: FC<SvgProps>, ActiveIcon: FC<SvgProps>): TabSpec => ({
  label,
  renderIcon: focused => (focused ? <ActiveIcon /> : <Icon />),
});

function useLucideTab() {
  const { colors } = useTheme();
  return (label: string, Icon: LucideIcon): TabSpec => ({
    label,
    renderIcon: focused => (
      <Icon
        size={20}
        strokeWidth={focused ? 2.25 : 1.75}
        color={focused ? colors.primaryContainer : colors.textSecondary}
      />
    ),
  });
}

// ---------------------------------------------------------------- shared

type AnyTabProps = CompositeScreenProps<
  BottomTabScreenProps<Record<string, undefined>>,
  NativeStackScreenProps<RootStackParamList>
>;

function ProfileRoute({ navigation }: AnyTabProps) {
  return (
    <SettingsScreen
      onOpenMasterProfile={masterId => navigation.navigate('MasterProfile', { masterId })}
      onBecomeMaster={() => navigation.navigate('BecomeMaster')}
    />
  );
}

// ---------------------------------------------------------------- client

const ClientTab = createBottomTabNavigator<MainTabParamList>();

const CLIENT_TABS: Record<keyof MainTabParamList, TabSpec> = {
  Discover: svgTab('nav.map', TabMap, TabMapActive),
  Bookings: svgTab('nav.bookings', TabBookings, TabBookingsActive),
  Favorites: svgTab('nav.favorites', TabFavorites, TabFavoritesActive),
  Profile: svgTab('nav.profile', TabProfile, TabProfileActive),
};

const renderClientBar = (props: BarProps) => <BottomTabBar {...props} tabs={CLIENT_TABS} />;

type ClientProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

function DiscoverRoute({ navigation }: ClientProps<'Discover'>) {
  return (
    <MapSearchScreen
      onOpenMaster={master =>
        navigation.navigate('MasterProfile', {
          masterId: master.id,
          preview: {
            distanceMeters: master.distanceMeters,
            lat: master.lat,
            lng: master.lng,
          },
        })
      }
    />
  );
}

function BookingsRoute({ navigation }: ClientProps<'Bookings'>) {
  return (
    <BookingsScreen
      onOpenMaster={masterId => navigation.navigate('MasterProfile', { masterId })}
      onFindMaster={() => navigation.navigate('Discover')}
    />
  );
}

function ClientTabs() {
  return (
    <ClientTab.Navigator tabBar={renderClientBar} screenOptions={{ headerShown: false }}>
      <ClientTab.Screen name="Discover" component={DiscoverRoute} />
      <ClientTab.Screen name="Bookings" component={BookingsRoute} />
      <ClientTab.Screen name="Favorites" component={FavoritesScreen} />
      <ClientTab.Screen name="Profile" component={ProfileRoute} />
    </ClientTab.Navigator>
  );
}

// ---------------------------------------------------------------- master

const MasterTab = createBottomTabNavigator<MasterTabParamList>();

function MasterTabs() {
  const tab = useLucideTab();
  const bookings = useBookings('as-master');
  const pending = (bookings.data ?? []).filter(b => masterTabOf(b) === 'requests').length;
  const tabs: Record<keyof MasterTabParamList, TabSpec> = {
    Calendar: tab('nav.calendar', CalendarDays),
    MasterBookings: tab('nav.bookings', NotebookTabs),
    Clients: tab('nav.clients', Users),
    Services: tab('nav.services', Scissors),
    Profile: tab('nav.profile', User),
  };
  const renderBar = (props: BarProps) => <BottomTabBar {...props} tabs={tabs} badges={{ MasterBookings: pending }} />;
  return (
    <MasterTab.Navigator tabBar={renderBar} screenOptions={{ headerShown: false }}>
      <MasterTab.Screen name="Calendar" component={MasterCalendarScreen} />
      <MasterTab.Screen name="MasterBookings" component={MasterBookingsScreen} />
      <MasterTab.Screen name="Clients" component={MasterClientsScreen} />
      <MasterTab.Screen name="Services" component={MasterServicesScreen} />
      <MasterTab.Screen name="Profile" component={ProfileRoute} />
    </MasterTab.Navigator>
  );
}

// ---------------------------------------------------------------- admin

const AdminTab = createBottomTabNavigator<AdminTabParamList>();

function AdminTabs() {
  const tab = useLucideTab();
  const requests = useAdminCatalogRequests('PENDING');
  const reports = useAdminReports('OPEN');
  const tabs: Record<keyof AdminTabParamList, TabSpec> = {
    Requests: tab('nav.requests', ClipboardList),
    Reports: tab('nav.reports', Flag),
    Stats: tab('nav.stats', BarChart3),
    Users: tab('nav.users', Users),
    Profile: tab('nav.profile', User),
  };
  const renderBar = (props: BarProps) => (
    <BottomTabBar
      {...props}
      tabs={tabs}
      badges={{
        Requests: requests.data?.length,
        Reports: reports.data?.length,
      }}
    />
  );
  return (
    <AdminTab.Navigator tabBar={renderBar} screenOptions={{ headerShown: false }}>
      <AdminTab.Screen name="Requests" component={AdminRequestsScreen} />
      <AdminTab.Screen name="Reports" component={AdminReportsScreen} />
      <AdminTab.Screen name="Stats" component={AdminStatsScreen} />
      <AdminTab.Screen name="Users" component={AdminUsersScreen} />
      <AdminTab.Screen name="Profile" component={ProfileRoute} />
    </AdminTab.Navigator>
  );
}

// ---------------------------------------------------------------- switch

export function MainTabs() {
  const { colors } = useTheme();
  const { data: me } = useMe();
  if (!me) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (me.context === 'MASTER') return <MasterTabs />;
  if (me.context === 'ADMIN' && me.isAdmin) return <AdminTabs />;
  return <ClientTabs />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

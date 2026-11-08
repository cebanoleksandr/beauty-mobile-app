import React, { useMemo } from 'react';
import { DarkTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsSignedIn } from '../auth';
import { LoginScreen } from '../features/auth/LoginScreen';
import { BookingScreen } from '../features/booking/BookingScreen';
import { MasterProfileScreen } from '../features/master-profile/MasterProfileScreen';
import { BecomeMasterScreen } from '../features/master/onboarding/BecomeMasterScreen';
import { RoleSelectScreen } from '../features/onboarding/RoleSelectScreen';
import { useTheme } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RoleSelectRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'RoleSelect'>) {
  return (
    <RoleSelectScreen
      onCompleted={() => navigation.replace('Main')}
      onBecomeMaster={() => navigation.navigate('BecomeMaster')}
    />
  );
}

function BecomeMasterRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'BecomeMaster'>) {
  return (
    <BecomeMasterScreen
      onBack={() => navigation.goBack()}
      // Onboarding switched the account to MASTER — Main now shows the master tabs.
      onDone={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
    />
  );
}

function MasterProfileRoute({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'MasterProfile'>) {
  return (
    <MasterProfileScreen
      masterId={route.params.masterId}
      preview={route.params.preview}
      onBack={() => navigation.goBack()}
      onBook={(master, service) =>
        navigation.navigate('Booking', { masterId: master.id, serviceId: service?.id })
      }
    />
  );
}

function BookingRoute({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Booking'>) {
  return (
    <BookingScreen
      masterId={route.params.masterId}
      initialServiceId={route.params.serviceId}
      onBack={() => navigation.goBack()}
      onOpenBookings={() => navigation.popTo('Main', { screen: 'Bookings' })}
    />
  );
}

/**
 * Auth-gated stack: signing in/out swaps the whole screen set, so there's
 * no way to "go back" into the app after sign-out (or to Login after sign-in).
 */
export function RootNavigator() {
  const isSignedIn = useIsSignedIn();
  const { colors } = useTheme();

  const navTheme = useMemo<NavTheme>(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.borderSubtle,
      },
    }),
    [colors],
  );

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {isSignedIn ? (
          <>
            <Stack.Screen name="RoleSelect" component={RoleSelectRoute} />
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="MasterProfile" component={MasterProfileRoute} />
            <Stack.Screen name="Booking" component={BookingRoute} />
            <Stack.Screen name="BecomeMaster" component={BecomeMasterRoute} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

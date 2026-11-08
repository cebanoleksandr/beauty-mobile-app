import React, { useMemo } from 'react';
import { DarkTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsSignedIn } from '../auth';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RoleSelectScreen } from '../features/onboarding/RoleSelectScreen';
import { useTheme } from '../theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RoleSelectRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'RoleSelect'>) {
  return <RoleSelectScreen onCompleted={() => navigation.replace('Main', { screen: 'Discover' })} />;
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
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

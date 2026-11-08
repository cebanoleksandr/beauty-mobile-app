/**
 * Slotly mobile app root.
 *
 * @format
 */

// i18n must be initialised before any screen renders.
import './src/i18n';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { QueryProvider } from './src/query';
import { ThemeProvider, useTheme } from './src/theme';

function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <ThemedStatusBar />
          <RootNavigator />
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />;
}

export default App;

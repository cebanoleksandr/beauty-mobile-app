import React, { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { darkTheme, lightTheme, type ColorSchemeName, type Theme } from './theme';

const ThemeContext = createContext<Theme>(darkTheme);

interface ThemeProviderProps {
  /** Force a scheme; by default the app is dark (as designed). Pass 'system' to follow the OS. */
  scheme?: ColorSchemeName | 'system';
}

export function ThemeProvider({ scheme = 'dark', children }: PropsWithChildren<ThemeProviderProps>) {
  const system = useColorScheme();
  const resolved = scheme === 'system' ? (system === 'light' ? 'light' : 'dark') : scheme;
  const theme = resolved === 'light' ? lightTheme : darkTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Theme-aware StyleSheet factory, defined once at module level:
 *
 *   const useStyles = makeStyles(t => ({
 *     card: { backgroundColor: t.colors.surface, borderRadius: t.radii.xl, padding: t.spacing.lg },
 *     title: { ...t.typography.titleMedium, color: t.colors.text },
 *   }));
 *   // in the component:
 *   const styles = useStyles();
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}

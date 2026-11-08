import { darkColors, lightColors, type ColorTokens } from './colors';
import { borderWidth, durations, elevation, opacity, radii, sizes, spacing } from './metrics';
import { palette } from './palette';
import { fontFamily, typography } from './typography';

export type ColorSchemeName = 'dark' | 'light';

export interface Theme {
  scheme: ColorSchemeName;
  dark: boolean;
  colors: ColorTokens;
  palette: typeof palette;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  spacing: typeof spacing;
  radii: typeof radii;
  sizes: typeof sizes;
  borderWidth: typeof borderWidth;
  elevation: typeof elevation;
  opacity: typeof opacity;
  durations: typeof durations;
}

const shared = {
  palette,
  typography,
  fontFamily,
  spacing,
  radii,
  sizes,
  borderWidth,
  elevation,
  opacity,
  durations,
};

export const darkTheme: Theme = { scheme: 'dark', dark: true, colors: darkColors, ...shared };
export const lightTheme: Theme = { scheme: 'light', dark: false, colors: lightColors, ...shared };

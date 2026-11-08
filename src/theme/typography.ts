/**
 * Typography — Plus Jakarta Sans everywhere (Headline / Body / Label roles).
 *
 * Fonts live in `assets/fonts` and are linked into the native projects by
 * `npx react-native-asset` (see `react-native.config.js`). Each weight is a
 * separate family: on Android, combining a custom `fontFamily` with
 * `fontWeight` can fall back to the system font, so variants set only
 * `fontFamily`. File name == PostScript name, so the same string works on
 * iOS and Android.
 */
import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
  /** Regular-weight italic (accent words in headings). */
  italic: 'PlusJakartaSans-Italic',
} as const;

export type FontWeightName = keyof typeof fontFamily;

type Variant = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

const v = (weight: FontWeightName, fontSize: number, lineHeight: number, letterSpacing = 0): Variant => ({
  fontFamily: fontFamily[weight],
  fontSize,
  lineHeight,
  letterSpacing,
});

export const typography = {
  // Headline — screen titles, hero numbers.
  displayLarge: v('semibold', 48, 56, -0.5),
  headlineLarge: v('semibold', 32, 40, -0.25),
  headlineMedium: v('semibold', 28, 36),
  headlineSmall: v('semibold', 24, 32),

  // Titles — card / section / sheet headers.
  titleLarge: v('semibold', 20, 28),
  titleMedium: v('semibold', 16, 24, 0.1),
  titleSmall: v('medium', 14, 20, 0.1),

  // Body — running text.
  bodyLarge: v('regular', 16, 24),
  bodyMedium: v('regular', 14, 20),
  bodySmall: v('regular', 12, 16, 0.12),

  // Label — buttons, chips, tabs, captions.
  labelLarge: v('medium', 14, 20, 0.1),
  labelMedium: v('medium', 12, 16, 0.25),
  labelSmall: v('medium', 11, 16, 0.4),

  /** Tiny uppercase tags ("STEP 1 OF 2", brand pill) — pair with textTransform: 'uppercase'. */
  overline: v('bold', 10, 12, 1),
} as const;

export type TypographyVariant = keyof typeof typography;

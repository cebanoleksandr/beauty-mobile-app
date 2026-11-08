/**
 * Semantic color tokens — what screens and components should use.
 * The design is dark-first; `lightColors` mirrors the same roles.
 */
import { baseColors, error, neutral, primary, secondary, tertiary } from './palette';

export interface ColorTokens {
  /** App background (Neutral). */
  background: string;
  /** Cards, sheets, list rows (Tertiary). */
  surface: string;
  /** Inputs, the bottom nav pill, secondary buttons — one step above `surface`. */
  surfaceVariant: string;
  /** Elevated / pressed surface. */
  surfaceHigh: string;
  /** Cards and round header buttons on screens (slightly darker than `surface`). */
  card: string;
  /** Inner wells inside a card (icon vessels, avatar backdrop). */
  cardInner: string;

  /** Brand peach — accents, primary icons, active states. */
  primary: string;
  onPrimary: string;
  /** Lighter peach fill — primary buttons, active nav item, label chips. */
  primaryContainer: string;
  onPrimaryContainer: string;

  /** Lavender — secondary accents, progress. */
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  /** High-contrast "Inverted" button. */
  inverse: string;
  onInverse: string;

  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  /** Main text. */
  text: string;
  /** Captions, section labels ("Headline", "Body" in the guide). */
  textSecondary: string;
  /** Placeholders, disabled text. */
  textMuted: string;
  /** Warm-tinted body text (the Body/Label "Aa" in the guide). */
  textAccent: string;

  /** Outlined button / input borders. */
  border: string;
  /** Hairline borders of cards / pills on dark backgrounds. */
  borderSubtle: string;
  /** Hairline dividers. */
  divider: string;
  /** Track behind progress bars / sliders. */
  track: string;

  /** Modal backdrop. */
  overlay: string;
  /** Neutral disabled fill (the grey icon button). */
  disabled: string;
  onDisabled: string;

  /** Translucent tag fills ("DEFAULT" / "ARTISAN" badges). */
  primaryBadge: string;
  onPrimaryBadge: string;
  secondaryBadge: string;
  onSecondaryBadge: string;

  /** Telegram brand blue (sign-in button icon, "connected" badge). */
  telegram: string;
  telegramBadge: string;

  /** Translucent controls floating over the map (search bar, map buttons, cards). */
  glass: string;
  glassBorder: string;
  glassBorderStrong: string;
  /** Bars docked over content (header, bottom sheet, tab bar). */
  chrome: string;
  /** Neutral filled button ("Book" on an unselected card). */
  buttonNeutral: string;
  /** Text on a peach button where `onPrimary` is too dark (card "Book"). */
  onPrimarySoft: string;
}

export const darkColors: ColorTokens = {
  background: baseColors.neutral,
  surface: baseColors.tertiary,
  surfaceVariant: tertiary[20],
  surfaceHigh: tertiary[25],
  card: '#1B1B1E',
  cardInner: '#1F1F22',

  primary: baseColors.primary,
  onPrimary: '#301408',
  primaryContainer: '#FFD2C1',
  onPrimaryContainer: primary[15],

  secondary: baseColors.secondary,
  onSecondary: secondary[10],
  secondaryContainer: '#C9B6FF',
  onSecondaryContainer: secondary[15],

  inverse: neutral[90],
  onInverse: neutral[10],

  error: error[80],
  onError: error[20],
  errorContainer: '#F2A39A',
  onErrorContainer: error[30],

  text: '#E4E1E6',
  textSecondary: '#9D8D88',
  textMuted: neutral[40],
  textAccent: '#D5C3BC',

  border: tertiary[30],
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  divider: tertiary[20],
  track: tertiary[20],

  overlay: 'rgba(0, 0, 0, 0.6)',
  disabled: tertiary[60],
  onDisabled: tertiary[15],

  primaryBadge: 'rgba(232, 180, 160, 0.2)',
  onPrimaryBadge: baseColors.primary,
  secondaryBadge: 'rgba(80, 40, 174, 0.4)',
  onSecondaryBadge: '#BEA8FF',

  telegram: '#2AABEE',
  telegramBadge: '#229ED9',

  glass: 'rgba(31, 31, 34, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.15)',
  chrome: 'rgba(14, 14, 17, 0.85)',
  buttonNeutral: '#2A2A2D',
  onPrimarySoft: '#6A4535',
};

export const lightColors: ColorTokens = {
  background: neutral[98],
  surface: neutral[100],
  surfaceVariant: neutral[95],
  surfaceHigh: neutral[90],
  card: neutral[100],
  cardInner: neutral[95],

  primary: primary[40],
  onPrimary: neutral[100],
  primaryContainer: primary[90],
  onPrimaryContainer: primary[15],

  secondary: secondary[60],
  onSecondary: neutral[100],
  secondaryContainer: secondary[90],
  onSecondaryContainer: secondary[15],

  inverse: neutral[10],
  onInverse: neutral[95],

  error: error[40],
  onError: neutral[100],
  errorContainer: error[90],
  onErrorContainer: error[30],

  text: neutral[10],
  textSecondary: neutral[40],
  textMuted: neutral[60],
  textAccent: primary[30],

  border: neutral[80],
  borderSubtle: 'rgba(0, 0, 0, 0.08)',
  divider: neutral[90],
  track: neutral[90],

  overlay: 'rgba(0, 0, 0, 0.4)',
  disabled: neutral[80],
  onDisabled: neutral[40],

  primaryBadge: primary[90],
  onPrimaryBadge: primary[30],
  secondaryBadge: secondary[90],
  onSecondaryBadge: secondary[30],

  telegram: '#2AABEE',
  telegramBadge: '#229ED9',

  glass: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBorderStrong: 'rgba(0, 0, 0, 0.12)',
  chrome: 'rgba(250, 250, 250, 0.9)',
  buttonNeutral: neutral[95],
  onPrimarySoft: primary[20],
};

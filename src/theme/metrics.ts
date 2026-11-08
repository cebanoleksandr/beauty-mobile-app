/** Spacing, radii, sizes, borders and elevation — measured off the style guide. */
import type { ViewStyle } from 'react-native';

/** 4-pt grid. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radii = {
  none: 0,
  /** Buttons, chips, label pills. */
  sm: 6,
  /** Inputs (search field), icon buttons. */
  md: 8,
  /** Small cards, tiles. */
  lg: 12,
  /** Main cards / panels. */
  xl: 16,
  /** Bottom sheets. */
  xxl: 24,
  /** Circles and pills (nav bar, avatar, round icon buttons). */
  full: 9999,
} as const;

export const sizes = {
  /** Min touch target. */
  touch: 44,
  buttonHeight: 40,
  buttonHeightSm: 32,
  inputHeight: 44,
  /** Round action buttons (magic / shapes / tag / delete in the guide). */
  iconButton: 32,
  iconButtonLg: 40,
  icon: 20,
  iconSm: 16,
  navBarHeight: 56,
  /** Progress bar thickness. */
  progress: 4,
  avatarSm: 32,
  avatar: 40,
  avatarLg: 64,
} as const;

export const borderWidth = {
  hairline: 0.5,
  thin: 1,
  thick: 2,
} as const;

/** Dark UIs rely on surface color, not shadow — keep elevation subtle. */
export const elevation: Record<'none' | 'sm' | 'md' | 'lg', ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
};

export const opacity = {
  disabled: 0.4,
  pressed: 0.7,
} as const;

export const durations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

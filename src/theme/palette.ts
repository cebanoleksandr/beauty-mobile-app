/**
 * Raw tonal palettes from the Slotly style guide. Each key is a tone
 * (0 = black … 100 = white), Material-style. Screens should NOT use these
 * directly — use the semantic tokens in `colors.ts`, so dark/light themes
 * and future rebrands stay a one-file change.
 *
 * Base colors (from the design):
 *   Primary   #E8B4A0  — peach
 *   Secondary #9D7BFF  — lavender
 *   Tertiary  #222228  — surfaces / cards
 *   Neutral   #0E0E11  — background
 */

export type Tone = 0 | 5 | 10 | 15 | 20 | 25 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 95 | 98 | 100;
export type TonalPalette = Readonly<Record<Tone, string>>;

export const baseColors = {
  primary: '#E8B4A0',
  secondary: '#9D7BFF',
  tertiary: '#222228',
  neutral: '#0E0E11',
} as const;

export const primary: TonalPalette = {
  0: '#000000',
  5: '#140905',
  10: '#29130A',
  15: '#3D1C0F',
  20: '#522514',
  25: '#662F1A',
  30: '#7A381F',
  40: '#A34B29',
  50: '#CC5D33',
  60: '#D67E5C',
  70: '#E09E85',
  80: '#EBBEAD',
  90: '#F5DFD6',
  95: '#FAEFEB',
  98: '#FDF9F7',
  100: '#FFFFFF',
};

export const secondary: TonalPalette = {
  0: '#000000',
  5: '#07001A',
  10: '#0D0033',
  15: '#14004D',
  20: '#1A0066',
  25: '#210080',
  30: '#270099',
  40: '#3500CC',
  50: '#4200FF',
  60: '#6833FF',
  70: '#8D66FF',
  80: '#B399FF',
  90: '#D9CCFF',
  95: '#ECE5FF',
  98: '#F7F5FF',
  100: '#FFFFFF',
};

export const tertiary: TonalPalette = {
  0: '#000000',
  5: '#0B0B0E',
  10: '#17171C',
  15: '#22222A',
  20: '#2E2E38',
  25: '#393946',
  30: '#454554',
  40: '#5C5C70',
  50: '#73738C',
  60: '#8F8FA3',
  70: '#ABABBA',
  80: '#C7C7D1',
  90: '#E3E3E8',
  95: '#F1F1F4',
  98: '#F9F9FA',
  100: '#FFFFFF',
};

export const neutral: TonalPalette = {
  0: '#000000',
  5: '#0C0C0E',
  10: '#18181B',
  15: '#242429',
  20: '#303036',
  25: '#3C3C44',
  30: '#484851',
  40: '#60606C',
  50: '#787887',
  60: '#93939F',
  70: '#AEAEB7',
  80: '#C9C9CF',
  90: '#E4E4E7',
  95: '#F1F1F3',
  98: '#FAFAFA',
  100: '#FFFFFF',
};

/** Destructive actions (the delete icon button in the design). */
export const error: TonalPalette = {
  0: '#000000',
  5: '#1F0503',
  10: '#410E0B',
  15: '#55120E',
  20: '#601410',
  25: '#73190F',
  30: '#8C1D18',
  40: '#B3261E',
  50: '#DC362E',
  60: '#E46962',
  70: '#EC928E',
  80: '#F2B8B5',
  90: '#F9DEDC',
  95: '#FCEEEE',
  98: '#FFF8F7',
  100: '#FFFFFF',
};

export const palette = { primary, secondary, tertiary, neutral, error } as const;

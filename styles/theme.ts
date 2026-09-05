/**
 * OinkBudget design tokens — "Aurora" brand (light + dark).
 *
 * Ported from `design/styles.css` (OKLCH source converted to sRGB hex).
 * Tailwind/NativeWind consumes these via CSS variables in `global.css`; this module
 * exposes the same values as JS constants for code that needs raw colors (SVG strokes
 * and fills, gradient stops, the React Navigation theme, etc.).
 */

/** A full set of semantic color tokens for one color scheme. */
export interface ThemePalette {
  primary: string;
  primaryPress: string;
  violetBright: string;
  primarySoft: string;
  primaryLine: string;
  onPrimary: string;
  accent: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  danger: string;
  dangerSoft: string;
  page: string;
  surface: string;
  card: string;
  card2: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  border2: string;
  /** Hero gradient stops `[from, to]`. */
  hero: [string, string];
  /** Ring (donut) gradient stops `[from, to]`. */
  ring: [string, string];
  ringTrack: string;
}

/** Aurora · Light. */
export const lightTheme: ThemePalette = {
  primary: '#7B4BE0',
  primaryPress: '#6533C0',
  violetBright: '#8F65F4',
  primarySoft: '#F0EAFF',
  primaryLine: '#DAD0FC',
  onPrimary: '#FFFFFF',
  accent: '#F17264',
  income: '#169F65',
  incomeSoft: '#D4F9E2',
  expense: '#E6424C',
  expenseSoft: '#FFE2DF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  page: '#F4F3F7',
  surface: '#F7F6FA',
  card: '#FFFFFF',
  card2: '#F9F8FC',
  text: '#201D2A',
  muted: '#696774',
  faint: '#93909C',
  border: '#E5E3E9',
  border2: '#D8D6DD',
  hero: ['#835FF2', '#8747D7'],
  ring: ['#A76EF8', '#7250E2'],
  ringTrack: '#E5E3EA',
};

/** Aurora · Dark. */
export const darkTheme: ThemePalette = {
  primary: '#A486FD',
  primaryPress: '#8D6BE7',
  violetBright: '#B69BFF',
  primarySoft: '#30264D',
  primaryLine: '#4A3F6F',
  onPrimary: '#0D0C15',
  accent: '#F68675',
  income: '#47C58C',
  incomeSoft: '#103C28',
  expense: '#F66C6D',
  expenseSoft: '#512222',
  danger: '#F87171',
  dangerSoft: '#451A1A',
  page: '#0B0A10',
  surface: '#0C0B12',
  card: '#17161F',
  card2: '#1E1D27',
  text: '#F6F4FA',
  muted: '#ABA9B6',
  faint: '#7B7885',
  border: '#2D2C36',
  border2: '#3D3B47',
  hero: ['#6741CA', '#6022A2'],
  ring: ['#BC8FFF', '#7E68E3'],
  ringTrack: '#2D2C37',
};

export const themes = { light: lightTheme, dark: darkTheme };

/** Returns the palette for the given color scheme (falls back to light). */
export const getTheme = (scheme: 'light' | 'dark' | null | undefined): ThemePalette =>
  scheme === 'dark' ? darkTheme : lightTheme;

/** Corner radii (px) — from `--r-*` in the design system. */
export const radius = {
  card: 24,
  inner: 16,
  chip: 12,
  pill: 999,
} as const;

/** Base spacing (px) — from `--gap` / `--pad`. */
export const spacing = {
  gap: 14,
  pad: 18,
} as const;

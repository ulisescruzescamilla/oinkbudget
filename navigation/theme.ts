/**
 * React Navigation themes derived from the Aurora design tokens.
 * Keeps the navigation container background/borders in sync with the app palette.
 */
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { darkTheme, lightTheme } from '@/styles/theme';

/** Navigation theme for the light color scheme. */
export const navLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightTheme.primary,
    background: lightTheme.surface,
    card: lightTheme.card,
    text: lightTheme.text,
    border: lightTheme.border,
    notification: lightTheme.expense,
  },
};

/** Navigation theme for the dark color scheme. */
export const navDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkTheme.primary,
    background: darkTheme.surface,
    card: darkTheme.card,
    text: darkTheme.text,
    border: darkTheme.border,
    notification: darkTheme.expense,
  },
};

/** Returns the navigation theme for the given color scheme. */
export const getNavTheme = (scheme: 'light' | 'dark' | null | undefined): Theme =>
  scheme === 'dark' ? navDarkTheme : navLightTheme;

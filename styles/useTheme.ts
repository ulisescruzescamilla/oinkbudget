/**
 * Returns the active Aurora palette (raw hex) for the current color scheme.
 *
 * Use for code that can't go through Tailwind classes — SVG strokes/fills, gradient
 * stops, etc. For normal styling prefer NativeWind classes (`bg-primary`, `text-text`…).
 */
import { useColorScheme } from 'nativewind';
import { getTheme, type ThemePalette } from '@/styles/theme';

/** Hook: the palette matching the active color scheme. */
export function useTheme(): ThemePalette {
  const { colorScheme } = useColorScheme();
  return getTheme(colorScheme);
}

/** Hook: whether the dark color scheme is active. */
export function useIsDark(): boolean {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark';
}

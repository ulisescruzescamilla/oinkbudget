/**
 * Category palette + icon set for the category form. Ported from `CAT_HUES` /
 * `CAT_ICONS` in `design/src/categories.jsx`; each hue is rendered as the
 * design's `oklch(0.62 0.17 h)` swatch, converted to hex because the API stores
 * `color` as a 7-char hex string.
 */
import type { IconName } from '@/components/ui';

/** Swatch colors offered when creating or editing a category. */
export const CATEGORY_COLORS = [
  '#8C6DE2',
  '#1289E7',
  '#009EBE',
  '#00A58A',
  '#00A35C',
  '#7A9300',
  '#C56E00',
  '#D95544',
  '#D8516A',
  '#BD5AB6',
] as const;

/** Icon glyphs offered when creating or editing a category. */
export const CATEGORY_ICONS: IconName[] = [
  'cart', 'fork', 'car', 'house', 'bolt', 'health', 'film', 'piggy', 'gift', 'coins', 'target', 'star',
  'wallet', 'card', 'building', 'plane', 'book', 'shirt', 'paw', 'briefcase', 'phone', 'dumbbell', 'tag', 'up',
];

/** Name of the built-in fallback category; it can't be renamed or deleted. */
export const DEFAULT_CATEGORY_NAME = 'Otro';

/**
 * Whether a category is the built-in default ("Otro").
 *
 * @param name - Category name
 */
export const isDefaultCategory = (name: string): boolean => name === DEFAULT_CATEGORY_NAME;

/**
 * Soft tint of a category color, for tile and icon-picker backgrounds
 * (the design's `oklch(0.95 0.045 h)` / dark `oklch(0.32 0.06 h)`).
 *
 * @param hex - Solid `#RRGGBB` color
 * @param dark - Whether dark mode is active
 */
export const categorySoft = (hex: string, dark: boolean): string => `${hex}${dark ? '40' : '1F'}`;

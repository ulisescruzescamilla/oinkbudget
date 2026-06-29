/**
 * Category → icon + color palette.
 *
 * Ported from `design/src/data.jsx` (`CATS`). The design computed colors at runtime from
 * an OKLCH hue; here each category's `solid` / `soft` / `softDark` / foreground colors are
 * precomputed to sRGB hex so React Native (no OKLCH support) can use them directly.
 */
import type { IconName } from '@/components/ui/Icon';

/** Visual style for a single category. */
export interface CategoryStyle {
  /** Icon glyph name from the design icon set. */
  icon: IconName;
  /** Saturated fill (used for solid tiles, legend swatches, allocation bars). */
  solid: string;
  /** Soft background tint (light scheme). */
  soft: string;
  /** Soft background tint (dark scheme). */
  softDark: string;
  /** Foreground/icon color on a soft tile (light scheme). */
  fg: string;
  /** Foreground/icon color on a soft tile (dark scheme). */
  fgDark: string;
}

/** Spanish category name → style. Keep keys in sync with the API/budget categories. */
export const CATEGORIES: Record<string, CategoryStyle> = {
  Mercado:      { icon: 'cart',   solid: '#8C6DE2', soft: '#EFEAFF', softDark: '#342C4F', fg: '#694BB4', fgDark: '#C2A8FF' },
  Renta:        { icon: 'house',  solid: '#1289E7', soft: '#D8F2FF', softDark: '#193550', fg: '#0064B9', fgDark: '#65C3FF' },
  Transporte:   { icon: 'car',    solid: '#009EBE', soft: '#CDF7FF', softDark: '#003B44', fg: '#007895', fgDark: '#00D8F6' },
  Restaurantes: { icon: 'fork',   solid: '#D95544', soft: '#FFE4DD', softDark: '#4D2620', fg: '#AC3225', fgDark: '#FF927E' },
  Ocio:         { icon: 'film',   solid: '#BD5AB6', soft: '#FFE4FD', softDark: '#442741', fg: '#93398E', fgDark: '#F695EE' },
  Ahorro:       { icon: 'piggy',  solid: '#00A35C', soft: '#D6F8E3', softDark: '#123C27', fg: '#007C3D', fgDark: '#4BDC95' },
  Salud:        { icon: 'health', solid: '#D8516A', soft: '#FFE3E6', softDark: '#4D252B', fg: '#AA2E4A', fgDark: '#FF8EA2' },
  Servicios:    { icon: 'bolt',   solid: '#C56E00', soft: '#FFEACF', softDark: '#462D0B', fg: '#9A4C00', fgDark: '#FEA92F' },
  Ingreso:      { icon: 'up',     solid: '#00A35C', soft: '#D6F8E3', softDark: '#123C27', fg: '#007C3D', fgDark: '#4BDC95' },
  Otro:         { icon: 'star',   solid: '#7575E9', soft: '#E8ECFF', softDark: '#2D2F51', fg: '#5552BB', fgDark: '#ABB0FF' },
};

/** Fallback style for unknown categories. */
const FALLBACK = CATEGORIES.Otro;

/** Returns the full style for a category (falls back to "Otro"). */
export const getCategoryStyle = (cat?: string): CategoryStyle =>
  (cat && CATEGORIES[cat]) || FALLBACK;

/** Returns the icon name for a category (falls back to "Otro"). */
export const catIcon = (cat?: string): IconName => getCategoryStyle(cat).icon;

/** Ordered list of expense category names (for chips/pickers). */
export const EXPENSE_CATEGORIES = [
  'Mercado', 'Restaurantes', 'Transporte', 'Ocio', 'Salud', 'Servicios', 'Otro',
] as const;

/** Ordered list of income source names. */
export const INCOME_CATEGORIES = ['Ingreso', 'Otro'] as const;

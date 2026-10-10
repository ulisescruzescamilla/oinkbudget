import { twMerge } from 'tailwind-merge';

/**
 * Joins truthy class name fragments into a single className string. When two
 * fragments set the same style (e.g. `text-text` and `text-danger`), the later
 * one wins — NativeWind would otherwise pick by stylesheet order.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '));
}

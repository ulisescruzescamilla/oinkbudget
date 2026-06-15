/**
 * Line-icon set + OinkBudget brandmark.
 *
 * Ported from `design/src/icons.jsx`. Each entry is SVG path data on a 24x24 grid;
 * multiple subpaths are separated by `|`. Strokes use `currentColor` in the source,
 * mapped here to the `color` prop. Rendered with `react-native-svg`.
 */
import Svg, { Ellipse, Path } from 'react-native-svg';

/** Raw path data keyed by icon name (subpaths joined with `|`). */
export const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  swap: 'M7 7h13l-3.5-3.5M17 17H4l3.5 3.5',
  bank: 'M3 9.5 12 4l9 5.5M4 9.5h16M5.5 9.5V18M9.5 9.5V18M14.5 9.5V18M18.5 9.5V18M3.5 18h17',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M4 12.5 9 17.5 20 6.5',
  cal: 'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5zM4 9.5h16M8 3.5v4M16 3.5v4',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.3 4M6.3 8.3A16 16 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.7-.7M9.5 9.5a3 3 0 0 0 4.2 4.2',
  edit: 'M4 20h4l10-10-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13',
  chev: 'M9 6l6 6-6 6',
  chevd: 'M6 9l6 6 6-6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z|M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  dots: 'M12 6h.01M12 12h.01M12 18h.01',
  cart: 'M3 4h2l2.3 11.5a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.8L20 7H6M9 21h.01M17 21h.01',
  car: 'M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M4 16h16v3H4zM7 16v2M17 16v2',
  fork: 'M6 3v7a2 2 0 0 0 4 0V3M8 12v9M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9',
  film: 'M4 5h16v14H4zM4 9h16M4 15h16M9 5v14M15 5v14',
  house: 'M4 11l8-6 8 6M6 10v9h12v-9',
  piggy: 'M4 12a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1a4 4 0 0 1-2 3.4V19h-3v-2h-2v2H8v-2.2A6 6 0 0 1 4 12zM20 11h1.5M8 9.5h.01',
  wallet: 'M4 7a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v2M3 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2zM17 13h.01',
  card: 'M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 10h18M7 15h4',
  building: 'M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 21V9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2',
  coins: 'M9 9a5 3 0 1 0 0-6 5 3 0 0 0 0 6zM4 6v4c0 1.7 2.2 3 5 3s5-1.3 5-3V6M10 13.5v3c0 1.7 2.2 3 5 3s5-1.3 5-3v-4M15 10.5a5 3 0 0 1 5 3',
  trend: 'M3 16l5-5 4 3 8-8M16 6h5v5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  health: 'M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6C19 16.5 12 21 12 21z',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  arrowright: 'M5 12h14M13 6l6 6-6 6',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7S10 3 7.5 4 9 7 12 7zM12 7s2-4 4.5-3S15 7 12 7z',
  star: 'M12 3l2.6 5.6L21 9.3l-4.5 4.3 1.1 6.1L12 17l-5.6 2.7 1.1-6.1L3 9.3l6.4-.7z',
} as const;

/** Name of an available icon glyph. */
export type IconName = keyof typeof ICONS;

export interface IconProps {
  /** Icon glyph to render. */
  name: IconName;
  /** Width/height in px. */
  size?: number;
  /** Stroke color. */
  color?: string;
  /** Stroke width. */
  strokeWidth?: number;
}

/**
 * Renders a single line icon from the design set.
 */
export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.9 }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  const subpaths = d.split('|');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {subpaths.map((p, i) => (
        <Path
          key={i}
          d={p}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export interface OinkMarkProps {
  /** Width/height in px. */
  size?: number;
  /** Snout color. */
  color?: string;
}

/**
 * OinkBudget pig-snout brandmark — built from simple ellipses.
 * Ported from `design/src/icons.jsx` `OinkMark`.
 */
export function OinkMark({ size = 24, color = '#fff' }: OinkMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Ellipse cx={16} cy={17} rx={11} ry={9} fill={color} />
      <Ellipse cx={9.5} cy={8.5} rx={3.2} ry={4} fill={color} transform="rotate(-18 9.5 8.5)" />
      <Ellipse cx={22.5} cy={8.5} rx={3.2} ry={4} fill={color} transform="rotate(18 22.5 8.5)" />
      <Ellipse cx={16} cy={18} rx={6.3} ry={5} fill="rgba(0,0,0,0.16)" />
      <Ellipse cx={13} cy={18} rx={1.5} ry={2.1} fill="rgba(0,0,0,0.32)" />
      <Ellipse cx={19} cy={18} rx={1.5} ry={2.1} fill="rgba(0,0,0,0.32)" />
    </Svg>
  );
}

export default Icon;

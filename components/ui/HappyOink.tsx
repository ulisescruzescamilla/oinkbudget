/**
 * HappyOink — smiling pig face for celebration screens.
 * Ported from `HappyOink` in `design/src/wizard-steps.jsx`.
 */
import Svg, { Ellipse, Path } from 'react-native-svg';

export interface HappyOinkProps {
  /** Width/height in px. */
  size?: number;
}

/** White pig face with closed, smiling eyes. Meant to sit on a colored badge. */
export function HappyOink({ size = 96 }: HappyOinkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M30 30c-6-7-13-7-13-1 0 7 8 12 14 12z" fill="#fff" />
      <Path d="M70 30c6-7 13-7 13-1 0 7-8 12-14 12z" fill="#fff" />
      <Ellipse cx={50} cy={55} rx={32} ry={28} fill="#fff" />
      <Ellipse cx={31} cy={60} rx={6} ry={4.5} fill="#F7A8AE" fillOpacity={0.7} />
      <Ellipse cx={69} cy={60} rx={6} ry={4.5} fill="#F7A8AE" fillOpacity={0.7} />
      <Path d="M37 48c2-3 6-3 8 0" fill="none" stroke="#35304A" strokeWidth={3} strokeLinecap="round" />
      <Path d="M55 48c2-3 6-3 8 0" fill="none" stroke="#35304A" strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={50} cy={63} rx={13} ry={9.5} fill="#F9D5E5" />
      <Ellipse cx={45.5} cy={63} rx={2.1} ry={3} fill="#7C4763" />
      <Ellipse cx={54.5} cy={63} rx={2.1} ry={3} fill="#7C4763" />
    </Svg>
  );
}

export default HappyOink;

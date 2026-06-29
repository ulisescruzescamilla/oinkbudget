/**
 * ProgressBar — ported from the `.bar` styles + `Progress` primitive in the design.
 * Fill turns to the expense color when at/over 100% unless a `tone` is forced.
 */
import { View } from 'react-native';

export interface ProgressBarProps {
  /** Current value. */
  value: number;
  /** Maximum value. */
  max: number;
  /** Force a fill tone; otherwise derived from the ratio. */
  tone?: 'primary' | 'danger' | 'ok';
  /** Track height in px. */
  height?: number;
  className?: string;
}

const TONE_CLASS: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  primary: 'bg-primary',
  danger: 'bg-expense',
  ok: 'bg-income',
};

/** Horizontal progress track with a rounded fill. */
export function ProgressBar({ value, max, tone, height = 9, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const fill = tone ? TONE_CLASS[tone] : pct >= 100 ? 'bg-expense' : 'bg-primary';
  return (
    <View
      className={`overflow-hidden rounded-pill bg-card-2 ${className ?? ''}`}
      style={{ height }}
    >
      <View className={`h-full rounded-pill ${fill}`} style={{ width: `${pct}%` }} />
    </View>
  );
}

export default ProgressBar;

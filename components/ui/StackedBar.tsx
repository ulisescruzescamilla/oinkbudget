/**
 * StackedBar — horizontal bar split into colored segments.
 * Ported from the `.alloc-bar` styles in the design.
 */
import { View } from 'react-native';
import { cn } from './cn';

/** One slice of the bar. */
export interface StackedBarSegment {
  key: string;
  /** Share of the full width, 0–100. */
  pct: number;
  color: string;
}

export interface StackedBarProps {
  segments: StackedBarSegment[];
  className?: string;
}

/** Rounded track filled left to right by `segments`. */
export function StackedBar({ segments, className }: StackedBarProps) {
  return (
    <View className={cn('h-[18px] flex-row gap-0.5 overflow-hidden rounded-pill bg-card-2', className)}>
      {segments.map((s) => (
        <View key={s.key} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
      ))}
    </View>
  );
}

export default StackedBar;

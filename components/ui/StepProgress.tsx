/**
 * StepProgress — one pill segment per step of a flow.
 * Ported from the `.wiz-steps` styles in the design.
 */
import { View } from 'react-native';

export interface StepProgressProps {
  /** Total number of steps. */
  steps: number;
  /** Zero-based index of the step in progress. */
  current: number;
}

/** Row of segments: completed ones are filled, the current one partly. */
export function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <View
      className="flex-row gap-1.5"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps, now: current + 1 }}
    >
      {Array.from({ length: steps }, (_, i) => (
        <View key={i} className="h-[5px] flex-1 overflow-hidden rounded-pill bg-border">
          {i <= current ? (
            <View className="h-full rounded-pill bg-primary" style={{ width: i < current ? '100%' : '60%' }} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default StepProgress;

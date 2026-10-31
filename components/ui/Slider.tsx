/**
 * Slider — draggable value track. Ported from the `.wslider` styles in the design.
 * Controlled: reports each change through `onChange` and renders `value`.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/styles/useTheme';

const THUMB = 22;
const TRACK = 7;

export interface SliderProps {
  value: number;
  min?: number;
  max: number;
  /** Increment the value snaps to. */
  step?: number;
  /** Fill and thumb-border color. Defaults to the primary color. */
  color?: string;
  onChange: (value: number) => void;
  /** Accessible name for screen readers — the slider has no visible label. */
  accessibilityLabel?: string;
}

/** Horizontal slider with a colored fill and a bordered thumb. */
export function Slider({ value, min = 0, max, step = 1, color, onChange, accessibilityLabel }: SliderProps) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const fill = color ?? t.primary;
  const span = max - min;
  const ratio = span > 0 ? Math.min(1, Math.max(0, (value - min) / span)) : 0;
  const travel = Math.max(0, width - THUMB);

  const snap = (raw: number) => Math.min(max, Math.max(min, Math.round(raw / step) * step));

  /** Maps a touch x (relative to the slider) to a value; the thumb's centre follows the finger. */
  const setFromX = (x: number) => {
    if (travel <= 0 || span <= 0) return;
    const next = snap(min + Math.min(1, Math.max(0, (x - THUMB / 2) / travel)) * span);
    if (next !== value) onChange(next);
  };

  // Horizontal drags only, so a vertical swipe still scrolls the screen.
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onStart((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x));
  // A finger that moves is scrolling, not tapping.
  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDistance(10)
    .onEnd((e) => setFromX(e.x));

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = snap(value + (e.nativeEvent.actionName === 'increment' ? step : -step));
          if (next !== value) onChange(next);
        }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: THUMB + 6, justifyContent: 'center' }}
      >
        <View style={{ height: TRACK, borderRadius: 999, backgroundColor: t.ringTrack, overflow: 'hidden' }}>
          <View style={{ width: THUMB / 2 + ratio * travel, height: TRACK, backgroundColor: fill }} />
        </View>
        <View
          style={{
            position: 'absolute',
            left: ratio * travel,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            borderWidth: 3,
            borderColor: fill,
            backgroundColor: t.card,
          }}
        />
      </View>
    </GestureDetector>
  );
}

export default Slider;

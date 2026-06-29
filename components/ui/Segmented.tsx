/**
 * Segmented — pill segmented control. Ported from the `.seg` styles in the design.
 */
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { cn } from './cn';

/** One segment option. */
export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Mutually-exclusive segmented toggle. */
export function Segmented<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <View className={cn('flex-row gap-0.5 rounded-pill border border-border bg-card-2 p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn('rounded-pill px-4 py-2', active && 'bg-primary shadow-btn')}
          >
            <Text className={cn('text-[13.5px] font-strong', active ? 'text-on-primary' : 'text-muted')}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default Segmented;

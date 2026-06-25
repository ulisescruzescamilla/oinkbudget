/**
 * Switch — boolean toggle. Styled with the same tokens as `Chip`/`Button`
 * (rounded-pill, primary/card-2 surfaces, shadow-soft) for a consistent feel.
 */
import { Pressable, View } from 'react-native';
import { cn } from './cn';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** Pill toggle switch. */
export function Switch({ value, onValueChange, disabled, className }: SwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      className={cn(
        'h-7 w-[46px] justify-center rounded-pill border p-0.5',
        value ? 'border-primary bg-primary' : 'border-border bg-card-2',
        disabled && 'opacity-50',
        className
      )}
    >
      <View
        className={cn('h-6 w-6 rounded-full bg-white shadow-soft', value ? 'self-end' : 'self-start')}
      />
    </Pressable>
  );
}

export default Switch;

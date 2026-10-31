/**
 * OptionCard — selectable card with a leading visual, title, subtitle and a
 * round check. Ported from the `.opt` styles in the design.
 */
import { Pressable, View } from 'react-native';
import { Icon } from './Icon';
import { Text } from './Text';
import { cn } from './cn';
import { useTheme } from '@/styles/useTheme';

export interface OptionCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Visual shown before the text (e.g. an `IconTile`). */
  leading?: React.ReactNode;
  /** Tighter padding and radius, for list rows. */
  compact?: boolean;
  /** `radio` for pick-one groups, `checkbox` for independent toggles. */
  role?: 'radio' | 'checkbox';
}

/** Card that toggles or picks an option. */
export function OptionCard({ title, subtitle, selected, onPress, leading, compact, role = 'radio' }: OptionCardProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      className={cn(
        'flex-row items-center gap-3.5 border-[1.5px] active:scale-[0.985]',
        compact ? 'rounded-inner px-3.5 py-3' : 'rounded-card p-4',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-card'
      )}
    >
      {leading}
      <View className="min-w-0 flex-1">
        <Text className="font-display text-[15.5px]" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-[12.5px] font-semi text-muted">{subtitle}</Text> : null}
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full border-2',
          selected ? 'border-primary bg-primary' : 'border-border-2'
        )}
      >
        {selected ? <Icon name="check" size={14} strokeWidth={3} color={t.onPrimary} /> : null}
      </View>
    </Pressable>
  );
}

export default OptionCard;

/**
 * Chip — selectable pill. Ported from the `.chip` styles in `design/styles.css`.
 */
import { Pressable } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { cn } from './cn';
import { useTheme } from '@/styles/useTheme';

export interface ChipProps {
  label: string;
  /** Selected state. */
  active?: boolean;
  /** Optional leading icon. */
  icon?: IconName;
  onPress?: () => void;
  className?: string;
}

/** Toggleable chip used for filters and category pickers. */
export function Chip({ label, active, icon, onPress, className }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-pill border px-3.5 py-2 active:scale-95',
        active ? 'bg-primary border-primary shadow-btn' : 'bg-card border-border',
        className
      )}
    >
      {icon ? (
        <Icon name={icon} size={15} strokeWidth={2.2} color={active ? t.onPrimary : t.muted} />
      ) : null}
      <Text className={cn('text-[13.5px] font-strong', active ? 'text-on-primary' : 'text-muted')}>
        {label}
      </Text>
    </Pressable>
  );
}

export default Chip;

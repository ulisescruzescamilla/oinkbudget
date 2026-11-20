/**
 * Chip — selectable pill. Ported from the `.chip` styles in `design/styles.css`.
 */
import { Pressable } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { cn } from './cn';
import { useTheme } from '@/styles/useTheme';

export interface ChipProps {
  /** Visible text. Omit for an icon-only chip (then pass `accessibilityLabel`). */
  label?: string;
  /** Screen-reader label; defaults to `label`. */
  accessibilityLabel?: string;
  /** Selected state. */
  active?: boolean;
  /** Optional leading icon. */
  icon?: IconName;
  /** Dashed, transparent look for the "more" pill (`.chip-new`). */
  dashed?: boolean;
  /** Keeps the label on one line, ellipsized, so the chip can shrink in a tight row. */
  truncate?: boolean;
  onPress?: () => void;
  className?: string;
}

/** Toggleable chip used for filters and category pickers. */
export function Chip({ label, accessibilityLabel, active, icon, dashed, truncate, onPress, className }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!active }}
      // `shadow-none` keeps a shadow class on the inactive chip: NativeWind
      // crashes in dev when a shadow is first added after mount.
      className={cn(
        'flex-row items-center gap-1.5 rounded-pill border px-3.5 py-2 active:scale-95',
        active ? 'bg-primary border-primary shadow-btn' : 'bg-card border-border shadow-none',
        dashed && 'border-dashed bg-transparent',
        truncate && 'min-w-0 shrink',
        className
      )}
    >
      {icon ? (
        <Icon name={icon} size={15} strokeWidth={2.2} color={active ? 'white' : t.muted} />
      ) : null}
      {label ? (
        <Text
          numberOfLines={truncate ? 1 : undefined}
          className={cn('text-[13.5px] font-strong', truncate && 'shrink', active ? 'text-white' : 'text-muted')}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default Chip;

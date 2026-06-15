/**
 * IconButton — square icon button. Ported from the `.iconbtn` styles in the design.
 */
import { Pressable } from 'react-native';
import { Icon, type IconName } from './Icon';
import { cn } from './cn';
import { useTheme } from '@/styles/useTheme';

export interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  /** Tinted (primary-soft) variant. */
  solid?: boolean;
  /** Button size in px. */
  size?: number;
  /** Icon glyph size in px. */
  iconSize?: number;
  /** Explicit icon color override. */
  color?: string;
  className?: string;
}

/** Compact square button holding a single icon. */
export function IconButton({
  icon,
  onPress,
  solid = false,
  size = 40,
  iconSize = 20,
  color,
  className,
}: IconButtonProps) {
  const t = useTheme();
  const fg = color ?? (solid ? t.primary : t.text);
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size }}
      className={cn(
        'items-center justify-center rounded-[14px] active:scale-90',
        solid ? 'bg-primary-soft' : 'bg-card border border-border shadow-soft',
        className
      )}
    >
      <Icon name={icon} size={iconSize} color={fg} />
    </Pressable>
  );
}

export default IconButton;

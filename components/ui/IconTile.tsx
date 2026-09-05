/**
 * IconTile — rounded icon tile. Pass explicit `icon`, `bg`, and `color`; all
 * three are optional and fall back to theme defaults (card2 / muted).
 */
import { View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { useTheme } from '@/styles/useTheme';

export interface IconTileProps {
  /** Icon glyph name. */
  icon?: IconName;
  /** Tile size in px. */
  size?: number;
  /** Tile background color (hex). */
  bg?: string;
  /** Icon foreground color (hex). */
  color?: string;
}

/** Square rounded tile holding a single icon. */
export function IconTile({ icon = 'chart', size = 42, bg, color }: IconTileProps) {
  const t = useTheme();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size >= 42 ? 13 : 10,
        backgroundColor: bg ?? t.card2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={size * 0.5} strokeWidth={2} color={color ?? t.muted} />
    </View>
  );
}

export default IconTile;

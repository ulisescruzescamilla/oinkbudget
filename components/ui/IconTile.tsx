/**
 * IconTile — rounded category/account icon tile.
 * Ported from the `IconTile` primitive in `design/src/ui.jsx`. Colors come from the
 * category palette (`styles/categories.ts`); pass an explicit `color`/`bg` to override.
 */
import { View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { getCategoryStyle } from '@/styles/categories';
import { useIsDark } from '@/styles/useTheme';

export interface IconTileProps {
  /** Icon glyph (defaults to the category's icon when `category` is given). */
  icon?: IconName;
  /** Category name used to derive icon + colors. */
  category?: string;
  /** Tile size in px. */
  size?: number;
  /** Solid (saturated) fill instead of the soft tint. */
  solid?: boolean;
  /** Explicit background override. */
  bg?: string;
  /** Explicit foreground (icon) override. */
  color?: string;
}

/** Square rounded tile holding a single icon. */
export function IconTile({ icon, category, size = 42, solid = false, bg, color }: IconTileProps) {
  const dark = useIsDark();
  const style = getCategoryStyle(category);
  const glyph = icon ?? style.icon;

  const background =
    bg ?? (solid ? style.solid : dark ? style.softDark : style.soft);
  const foreground =
    color ?? (solid ? '#ffffff' : dark ? style.fgDark : style.fg);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size >= 42 ? 13 : 10,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={glyph} size={size * 0.5} strokeWidth={2} color={foreground} />
    </View>
  );
}

export default IconTile;

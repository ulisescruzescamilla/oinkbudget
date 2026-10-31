/**
 * Brandmark — the OinkBudget snout on the hero gradient tile. Ported from the
 * `.brandmark` style in `design/styles.css`.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { OinkMark } from './Icon';
import { useTheme } from '@/styles/useTheme';

export interface BrandmarkProps {
  /** Tile width/height in px. */
  size?: number;
}

/** Gradient tile holding the OinkMark. */
export function Brandmark({ size = 40 }: BrandmarkProps) {
  const t = useTheme();
  return (
    <LinearGradient
      colors={t.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
    >
      <OinkMark size={22} />
    </LinearGradient>
  );
}

export default Brandmark;

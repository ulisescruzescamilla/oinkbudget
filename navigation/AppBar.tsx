/**
 * AppBar — sticky screen header with the brandmark, eyebrow + title, and a
 * light/dark theme toggle. Ported from the `.appbar` block in `design/src/app.jsx`.
 */
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading, IconButton, Muted, OinkMark } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';

export interface AppBarProps {
  /** Small label above the title. */
  eyebrow: string;
  /** Screen title. */
  title: string;
}

/** Top app bar shown on every tab. */
export function AppBar({ eyebrow, title }: AppBarProps) {
  const t = useTheme();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <View className="flex-row items-center justify-between bg-surface px-[18px] pb-3 pt-2">
      <View className="flex-row items-center gap-2.5">
        <LinearGradient
          colors={t.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
        >
          <OinkMark size={22} />
        </LinearGradient>
        <View>
          <Muted className="text-[12.5px]">{eyebrow}</Muted>
          <Heading size="lg" className="text-[23px] leading-tight">
            {title}
          </Heading>
        </View>
      </View>
      <IconButton icon={dark ? 'sun' : 'moon'} onPress={toggleColorScheme} />
    </View>
  );
}

export default AppBar;

/**
 * AppBar — sticky screen header with the brandmark (or a back button), eyebrow +
 * title, and a settings button that opens the side menu. Ported from the
 * `.appbar` block in `design/src/app.jsx`.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { Brandmark, Heading, IconButton, Muted } from '@/components/ui';
import { SyncStatusIndicator } from '@/components/features';
import { SideMenu, type SideMenuItem } from './SideMenu';

export interface AppBarProps {
  /** Small label above the title. */
  eyebrow: string;
  /** Screen title. */
  title: string;
  /** When set, a back button replaces the brandmark and the settings button is hidden. */
  onBack?: () => void;
}

/** Top app bar shown on every tab. */
export function AppBar({ eyebrow, title, onBack }: AppBarProps) {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const [menu, setMenu] = useState(false);
  const router = useRouter();

  const menuItems: SideMenuItem[] = [
    {
      id: 'recurrent-budgets',
      icon: 'tag',
      label: 'Presupuestos recurrentes',
      sub: 'Crea, edita y elimina tus presupuestos recurrentes',
      onPress: () => { setMenu(false); router.push('/recurrent-budgets'); },
    },
    {
      id: 'categories',
      icon: 'filter',
      label: 'Categorías',
      sub: 'Clasifica tus ingresos y gastos',
      onPress: () => { setMenu(false); router.push('/categories'); },
    },
    { id: 'theme', icon: dark ? 'sun' : 'moon', label: 'Modo oscuro', toggle: dark, onPress: toggleColorScheme },
  ];

  return (
    <View className="flex-row items-center justify-between bg-surface px-[18px] pb-3 pt-2">
      <View className="flex-row items-center gap-2.5">
        {onBack ? (
          <IconButton icon="back" onPress={onBack} accessibilityLabel="Volver" />
        ) : (
          <Brandmark />
        )}
        <View>
          <Muted className="text-[12.5px]">{eyebrow}</Muted>
          <Heading size="lg" className="text-[23px] leading-tight">
            {title}
          </Heading>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <SyncStatusIndicator />
        {!onBack && <IconButton icon="settings" onPress={() => setMenu(true)} accessibilityLabel="Ajustes" />}
      </View>
      {!onBack && <SideMenu open={menu} onClose={() => setMenu(false)} items={menuItems} />}
    </View>
  );
}

export default AppBar;

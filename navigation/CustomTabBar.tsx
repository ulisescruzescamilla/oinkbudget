/**
 * CustomTabBar — bottom navigation with a central gradient FAB.
 * Ported from the `.tabbar` / `.fab` block in `design/src/app.jsx`.
 * Passed to expo-router `<Tabs tabBar={...} />`.
 */
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName, Text } from '@/components/ui';
import { useQuickAdd } from './QuickAddProvider';
import { useTheme } from '@/styles/useTheme';

/** Per-route tab metadata (icon + Spanish label). */
const TAB_META: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Inicio' },
  history: { icon: 'swap', label: 'Movimientos' },
  accounts: { icon: 'bank', label: 'Cuentas' },
  budgets: { icon: 'chart', label: 'Presupuestos' },
};

/** Visual order around the center FAB. */
const LEFT = ['index', 'history'];
const RIGHT = ['accounts', 'budgets'];

export type CustomTabBarProps = BottomTabBarProps;

/** Renders the bottom tab bar plus the center add button. */
export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { open } = useQuickAdd();

  const activeName = state.routes[state.index]?.name;

  const renderTab = (name: string) => {
    const meta = TAB_META[name];
    if (!meta) return null;
    const focused = activeName === name;
    return (
      <Pressable
        key={name}
        className="flex-1 items-center gap-1 rounded-[14px] px-2.5 py-1"
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(name);
        }}
      >
        <Icon
          name={meta.icon}
          size={23}
          strokeWidth={focused ? 2.3 : 2}
          color={focused ? t.primary : t.faint}
        />
        <Text className="text-[11px] font-strong" style={{ color: focused ? t.primary : t.faint }}>
          {meta.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="flex-row items-center justify-around border-t border-border bg-card px-3.5 pt-2.5"
      style={{ paddingBottom: insets.bottom + 10 }}
    >
      {LEFT.map(renderTab)}
      <Pressable onPress={() => open('expense')} className="active:scale-90" style={{ marginTop: -26 }}>
        <LinearGradient
          colors={t.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="plus" size={26} strokeWidth={2.6} color="#fff" />
        </LinearGradient>
      </Pressable>
      {RIGHT.map(renderTab)}
    </View>
  );
}

export default CustomTabBar;

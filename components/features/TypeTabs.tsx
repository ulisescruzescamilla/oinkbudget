/**
 * TypeTabs — the expense / income pill tabs. Ported from the `.qa-tabs` block
 * shared by `QuickAdd` (`design/src/quickadd.jsx`) and `TxCategories`
 * (`design/src/txcats.jsx`). The active tab takes the expense or income color.
 */
import { Pressable, View } from 'react-native';
import { Icon, Text, cn } from '@/components/ui';
import { useTheme } from '@/styles/useTheme';

export type TypeTabValue = 'expense' | 'income';

export interface TypeTabsProps {
  value: TypeTabValue;
  onChange: (value: TypeTabValue) => void;
  /** Tab labels, e.g. `{ expense: 'Gasto', income: 'Ingreso' }`. */
  labels: Record<TypeTabValue, string>;
}

const TABS: { value: TypeTabValue; icon: 'down' | 'up' }[] = [
  { value: 'expense', icon: 'down' },
  { value: 'income', icon: 'up' },
];

/** Expense / income tab switcher. */
export function TypeTabs({ value, onChange, labels }: TypeTabsProps) {
  const t = useTheme();
  return (
    <View accessibilityRole="tablist" className="flex-row gap-1 rounded-pill border border-border bg-card-2 p-1">
      {TABS.map((tab) => {
        const active = value === tab.value;
        const color = active ? (tab.value === 'income' ? t.income : t.expense) : t.muted;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.value)}
            // `shadow-none` keeps a shadow class on the inactive tab: NativeWind
            // crashes in dev when a shadow is first added after mount.
            className={cn(
              'h-[42px] flex-1 flex-row items-center justify-center gap-[7px] rounded-pill',
              active ? 'bg-card shadow-soft' : 'shadow-none'
            )}
          >
            <Icon name={tab.icon} size={17} strokeWidth={2.4} color={color} />
            <Text className="font-display text-[14.5px]" style={{ color }}>
              {labels[tab.value]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default TypeTabs;

/**
 * AllocationBar — how the monthly income is split across budgets.
 * Ported from the allocation card in `design/src/budgets.jsx`. Uses each budget's
 * `percentage_value` (out of 100%); the remainder is shown as "Sin asignar".
 */
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { BudgetType } from '@/types/BudgetType';
import { getCategoryStyle } from '@/styles/categories';
import { useTheme } from '@/styles/useTheme';

export interface AllocationBarProps {
  budgets: BudgetType[];
}

/** Resolves a budget's swatch color from its category. */
function budgetColor(b: BudgetType): string {
  return getCategoryStyle(b.name).solid;
}

/** Stacked allocation bar + legend. */
export function AllocationBar({ budgets }: AllocationBarProps) {
  const t = useTheme();
  const allocated = budgets.reduce((s, b) => s + (b.percentage_value || 0), 0);
  const unallocated = Math.max(0, 100 - allocated);

  const segments = [
    ...budgets.map((b) => ({ key: String(b.id), name: b.name, pct: b.percentage_value || 0, color: budgetColor(b) })),
    ...(unallocated > 0 ? [{ key: 'unassigned', name: 'Sin asignar', pct: unallocated, color: t.ringTrack }] : []),
  ];

  return (
    <View>
      <View className="my-3.5 h-[18px] flex-row gap-0.5 overflow-hidden rounded-pill bg-card-2">
        {segments.map((s) => (
          <View key={s.key} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
        ))}
      </View>

      <View className="gap-2.5">
        {segments.map((s) => (
          <View key={s.key} className="flex-row items-center gap-2.5">
            <View style={{ width: 11, height: 11, borderRadius: 4, backgroundColor: s.color }} />
            <Text className="flex-1 font-strong text-[13px]">{s.name}</Text>
            <Text className="text-[12px] font-strong text-faint">{Math.round(s.pct)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default AllocationBar;

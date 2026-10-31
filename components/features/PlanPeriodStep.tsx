/**
 * PlanPeriodStep — step 1 of the plan wizard: how often the user plans.
 * Ported from `StepPeriodo` in `design/src/wizard-steps.jsx`.
 */
import { View } from 'react-native';
import { Icon, OptionCard, Text } from '@/components/ui';
import { PlanPeriodType } from '@/types/PlanType';
import { formatDateRange, periodRange } from '@/utils/formatting';
import { PLAN_PERIODS } from '@/utils/plan';
import { useTheme } from '@/styles/useTheme';

export interface PlanPeriodStepProps {
  period: PlanPeriodType;
  onChange: (period: PlanPeriodType) => void;
}

/** Pick-one list of plan periods, each with the dates it currently covers. */
export function PlanPeriodStep({ period, onChange }: PlanPeriodStepProps) {
  const t = useTheme();
  return (
    <View className="gap-3" accessibilityRole="radiogroup">
      {PLAN_PERIODS.map((p) => {
        const selected = period === p.value;
        const { start, end } = periodRange(p.value);
        return (
          <OptionCard
            key={p.value}
            title={p.label}
            subtitle={`${p.sub} · ${formatDateRange(start, end)}`}
            selected={selected}
            onPress={() => onChange(p.value)}
            leading={
              <View
                className="h-[46px] w-[46px] items-center justify-center rounded-[14px]"
                style={{ backgroundColor: selected ? t.primary : t.primarySoft }}
              >
                <Icon name={p.icon} size={23} strokeWidth={2.1} color={selected ? t.onPrimary : t.primary} />
              </View>
            }
          />
        );
      })}
      <View className="flex-row items-center gap-2 px-1.5 pt-2">
        <Icon name="bolt" size={16} strokeWidth={2.2} color={t.muted} />
        <Text className="flex-1 text-[13px] font-strong text-muted">
          Podrás cambiar el periodo más adelante sin perder tus presupuestos.
        </Text>
      </View>
    </View>
  );
}

export default PlanPeriodStep;

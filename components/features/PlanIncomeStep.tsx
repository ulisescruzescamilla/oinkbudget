/**
 * PlanIncomeStep — step 3 of the plan wizard: the income to split.
 * Ported from `StepIngreso` in `design/src/wizard-steps.jsx`.
 */
import { View } from 'react-native';
import { Chip, Icon, Keypad, KEYPAD_DELETE, Text } from '@/components/ui';
import { PlanPeriodType } from '@/types/PlanType';
import { cashFormatRounded, formatDateRange, periodRange } from '@/utils/formatting';
import { MAX_PLAN_INCOME, getPlanPeriod } from '@/utils/plan';
import { useTheme } from '@/styles/useTheme';

export interface PlanIncomeStepProps {
  /** Income in whole pesos. */
  income: number;
  onChange: (income: number) => void;
  period: PlanPeriodType;
  /** Combined balance of the accounts in the plan, shown as a reference. */
  accountsTotal: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', KEYPAD_DELETE];
/** Amounts the shortcut chips add to the income. */
const QUICK_AMOUNTS = [1000, 5000, 10000];

/** Whole-peso amount capture with a keypad and add-amount shortcuts. */
export function PlanIncomeStep({ income, onChange, period, accountsTotal }: PlanIncomeStepProps) {
  const t = useTheme();
  const meta = getPlanPeriod(period);
  const { start, end } = periodRange(period);

  const set = (value: number) => onChange(Math.min(MAX_PLAN_INCOME, value));
  const press = (k: string) => {
    if (k === KEYPAD_DELETE) set(Math.floor(income / 10));
    else if (k === '000') set(income * 1000);
    else set(income * 10 + Number(k));
  };

  return (
    <View className="gap-3 pt-1">
      <Text className="text-center font-display text-[52px]" style={{ color: t.income }}>
        <Text className="text-[30px] text-muted">$ </Text>
        {income.toLocaleString('es-MX')}
      </Text>

      <View className="flex-row items-center justify-center gap-1.5">
        <Icon name="bank" size={15} strokeWidth={2.1} color={t.muted} />
        <Text className="text-[12.5px] font-strong text-muted">
          Disponible en tus cuentas: <Text className="font-strong text-text">{cashFormatRounded(accountsTotal)}</Text>
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-2 pb-1">
        {QUICK_AMOUNTS.map((q) => (
          <Chip key={q} label={`+${cashFormatRounded(q)}`} onPress={() => set(income + q)} />
        ))}
        <Chip label="Limpiar" onPress={() => set(0)} />
      </View>

      <Keypad keys={KEYS} onPress={press} />

      <View className="flex-row items-center justify-center gap-2 pt-1">
        <Icon name={meta.icon} size={15} strokeWidth={2.1} color={t.muted} />
        <Text className="text-[13px] font-strong text-muted">
          {meta.incomeLabel} · {formatDateRange(start, end)}
        </Text>
      </View>
    </View>
  );
}

export default PlanIncomeStep;

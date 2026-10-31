/**
 * NewBudgetForm — create/edit a budget. Ported from `NewBudgetForm` in
 * `design/src/app.jsx`. The user picks a category first (the name defaults to
 * it), then sets the limit as an amount or as a share of their income. The
 * period defaults to the current calendar month.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Icon, ModalField, Segmented, Switch, Text } from '@/components/ui';
import { BudgetRow } from './BudgetRow';
import { BudgetPeriodType, BudgetType } from '@/types/BudgetType';
import { PlanSplitMode } from '@/types/PlanType';
import { FieldErrors, getFieldError } from '@/utils/errorHandler';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/styles/useTheme';
import { cashFormatRounded, periodRange } from '@/utils/formatting';
import type { IconName } from '@/components/ui';

/** Selectable recurrence cadences for a recurrent budget. */
const BUDGET_PERIOD_OPTIONS: { value: BudgetPeriodType; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
];

const MODE_OPTIONS: { value: PlanSplitMode; label: string }[] = [
  { value: 'amt', label: '$' },
  { value: 'pct', label: '%' },
];

export interface NewBudgetFormProps {
  budget?: BudgetType | null;
  onSubmit: (budget: BudgetType) => Promise<BudgetType | undefined>;
  onDone: () => void;
  fieldErrors: FieldErrors | null;
  loading?: boolean;
  /** Share of the income (0–100) already assigned across all budgets, including `budget`. */
  allocatedPercentage?: number;
}

/** Keeps a percentage in 0–`max`, as a whole number. */
const clampPercent = (value: number, max: number) => Math.max(0, Math.min(max, Math.round(value)));

/** Form for creating or editing a budget. */
export function NewBudgetForm({
  budget,
  onSubmit,
  onDone,
  fieldErrors,
  loading,
  allocatedPercentage = 0,
}: NewBudgetFormProps) {
  const t = useTheme();
  const { categories } = useCategories();
  const [name, setName] = useState(budget?.name ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(budget?.category_id ?? null);
  const [mode, setMode] = useState<PlanSplitMode>('amt');
  const [max, setMax] = useState(budget ? String(budget.max_limit) : '');
  const [percent, setPercent] = useState(Number(budget?.percentage_value) || 0);
  const [isRecurrent, setIsRecurrent] = useState(budget?.is_recurrent ?? false);
  const [period, setPeriod] = useState<BudgetPeriodType>(budget?.period ?? 'monthly');

  useEffect(() => {
    setName(budget?.name ?? '');
    setCategoryId(budget?.category_id ?? null);
    setMode('amt');
    setMax(budget ? String(budget.max_limit) : '');
    setPercent(Number(budget?.percentage_value) || 0);
    setIsRecurrent(budget?.is_recurrent ?? false);
    setPeriod(budget?.period ?? 'monthly');
  }, [budget]);

  const category = categories.find((c) => c.id === categoryId);
  // The budget being edited gives back its own share.
  const availablePercent = Math.max(
    0,
    Math.round(100 - allocatedPercentage + (Number(budget?.percentage_value) || 0))
  );
  const amount = parseFloat(max) || 0;
  const isPercent = mode === 'pct';
  const hasLimit = isPercent ? percent > 0 : amount > 0;
  const label = name.trim() || category?.name || 'Nuevo presupuesto';
  const limitError = getFieldError(fieldErrors ?? undefined, isPercent ? 'percentage_value' : 'max_limit');

  const submit = async () => {
    const { start, end } = periodRange('monthly');
    const result = await onSubmit({
      id: budget?.id ?? null,
      name: name.trim() || category?.name || '',
      // `useBudgets` sends `max_limit` when it is set and `percentage_value` otherwise.
      max_limit: isPercent ? 0 : amount,
      percentage_value: isPercent ? percent : Number(budget?.percentage_value) || 0,
      start_date: budget?.start_date ?? start,
      end_date: budget?.end_date ?? end,
      is_recurrent: isRecurrent,
      period,
      category_id: categoryId,
    });
    if (result) onDone();
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <View className="gap-4">
        <ModalField
          label="Nombre"
          placeholder={category?.name ?? 'Ej. Mercado'}
          value={name}
          onChangeText={setName}
          error={getFieldError(fieldErrors ?? undefined, 'name')}
        />

        {categories.length > 0 && (
          <View className="gap-[7px]">
            <Text className="text-[12.5px] font-strong text-muted">Categoría</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  icon={c.icon_code as IconName}
                  active={categoryId === c.id}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View className="gap-[7px]">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12.5px] font-strong text-muted">Monto máximo</Text>
            <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />
          </View>
          <BudgetRow
            solo
            label={label}
            icon={category?.icon_code as IconName | undefined}
            color={category?.color}
            value={isPercent ? `${percent}%` : cashFormatRounded(amount)}
            detail={isPercent ? `de ${availablePercent}%` : undefined}
            slider={
              isPercent
                ? { value: percent, max: availablePercent, step: 1, onChange: setPercent }
                : undefined
            }
          >
            {isPercent ? (
              <ModalField
                placeholder="0%"
                keyboardType="number-pad"
                value={percent ? String(percent) : ''}
                onChangeText={(text) => setPercent(clampPercent(parseFloat(text) || 0, availablePercent))}
                error={limitError}
              />
            ) : (
              <ModalField
                placeholder="$0.00"
                keyboardType="decimal-pad"
                value={max}
                onChangeText={setMax}
                error={limitError}
              />
            )}
          </BudgetRow>
          <Text className="px-0.5 text-[12px] font-strong text-muted">
            Disponible sin asignar:{' '}
            <Text className="font-strong text-text">{availablePercent - (isPercent ? percent : 0)}%</Text> de tu ingreso
          </Text>
        </View>

        <View className="flex-row items-center justify-between rounded-inner border border-border-2 bg-card px-3.5 py-3">
          <View className="flex-1 gap-0.5 pr-3">
            <Text className="text-[13.5px] font-strong text-text">Presupuesto recurrente</Text>
            <Text className="text-[12px] font-semi text-muted">
              Se vuelve a crear automáticamente cada periodo
            </Text>
          </View>
          <Switch value={isRecurrent} onValueChange={setIsRecurrent} />
        </View>

        {isRecurrent ? (
          <View className="gap-[7px]">
            <Text className="text-[12.5px] font-strong text-muted">Periodo</Text>
            <View className="flex-row flex-wrap gap-2">
              {BUDGET_PERIOD_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={period === opt.value}
                  onPress={() => setPeriod(opt.value)}
                />
              ))}
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <Icon name="cal" size={16} strokeWidth={2} color={t.muted} />
            <Text className="text-[13px] font-semi text-muted">
              Periodo: <Text className="font-strong text-text">Mensual</Text>
            </Text>
          </View>
        )}

        <Button icon="check" block size="lg" loading={loading} disabled={!hasLimit} onPress={submit}>
          {budget ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </View>
    </ScrollView>
  );
}

export default NewBudgetForm;

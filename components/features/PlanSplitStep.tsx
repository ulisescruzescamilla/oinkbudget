/**
 * PlanSplitStep — step 4 of the plan wizard: split the income across
 * recurrent budgets. Ported from `StepReparto` in `design/src/wizard-steps.jsx`.
 */
import { View } from 'react-native';
import { Button, Card, CardHeader, Chip, Segmented, StackedBar, Text, type IconName } from '@/components/ui';
import { BudgetRow } from './BudgetRow';
import { EmptyState } from './EmptyState';
import { RecurrentBudgetType } from '@/types/RecurrentBudgetType';
import { PlanRowType, PlanSplitMode } from '@/types/PlanType';
import { cashFormatRounded } from '@/utils/formatting';
import { useTheme } from '@/styles/useTheme';

export interface PlanSplitStepProps {
  income: number;
  rows: PlanRowType[];
  recurrentBudgets: RecurrentBudgetType[];
  mode: PlanSplitMode;
  onModeChange: (mode: PlanSplitMode) => void;
  onRowChange: (recurrentBudgetId: number, amount: number) => void;
  onRemoveRow: (recurrentBudgetId: number) => void;
  onAddRow: (recurrentBudgetId: number) => void;
  /** Replaces the rows with the suggested split. */
  onSuggest: () => void;
  /** Sets every row to zero. */
  onClear: () => void;
  /** Reloads the recurrent budgets when none could be loaded. */
  onRetryRecurrentBudgets?: () => void;
}

/** Slider granularity in pesos when editing amounts. */
const AMOUNT_STEP = 50;

const MODE_OPTIONS: { value: PlanSplitMode; label: string }[] = [
  { value: 'amt', label: '$' },
  { value: 'pct', label: '%' },
];

/** Summary of the split, one slider per recurrent budget and chips to add more. */
export function PlanSplitStep({
  income,
  rows,
  recurrentBudgets,
  mode,
  onModeChange,
  onRowChange,
  onRemoveRow,
  onAddRow,
  onSuggest,
  onClear,
  onRetryRecurrentBudgets,
}: PlanSplitStepProps) {
  const t = useTheme();
  const pctOf = (amount: number) => (income > 0 ? Math.round((amount / income) * 100) : 0);
  const recurrentBudgetOf = (id: number) => recurrentBudgets.find((r) => r.id === id);
  const colorOf = (id: number) => recurrentBudgetOf(id)?.color ?? t.primary;

  const allocated = rows.reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(0, income - allocated);
  const available = recurrentBudgets.filter((rb) => !rows.some((r) => r.recurrent_budget_id === rb.id));

  return (
    <View className="gap-3">
      <Card>
        <CardHeader
          title="Repartes tu ingreso"
          className="mb-2"
          right={<Segmented options={MODE_OPTIONS} value={mode} onChange={onModeChange} />}
        />
        <Text className="font-display text-[30px]">{cashFormatRounded(income)}</Text>
        <StackedBar
          className="mt-[13px]"
          segments={rows
            .filter((r) => r.amount > 0)
            .map((r) => ({
              key: String(r.recurrent_budget_id),
              pct: income > 0 ? (r.amount / income) * 100 : 0,
              color: colorOf(r.recurrent_budget_id),
            }))}
        />
        <View className="mt-2.5 flex-row gap-[18px]">
          <View>
            <Text className="text-[11.5px] font-strong text-muted">Asignado</Text>
            <Text className="mt-px font-display text-[15px] text-primary">
              {cashFormatRounded(allocated)} · {pctOf(allocated)}%
            </Text>
          </View>
          <View>
            <Text className="text-[11.5px] font-strong text-muted">Sin asignar</Text>
            <Text className="mt-px font-display text-[15px]" style={{ color: remaining > 0 ? t.text : t.income }}>
              {cashFormatRounded(remaining)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Template / reset */}
      <View className="gap-0.5 px-0.5">
        <Button variant="soft" icon="bolt" block onPress={onSuggest}>
          Sugerir reparto
        </Button>
        <Button variant="text" block onPress={onClear}>
          Vaciar reparto
        </Button>
      </View>

      <Card flush>
        {rows.length === 0 ? (
          <EmptyState icon="chart" message="Agrega presupuestos recurrentes para repartir tu ingreso." />
        ) : (
          rows.map((r, i) => {
            const recurrentBudget = recurrentBudgetOf(r.recurrent_budget_id);
            const money = cashFormatRounded(r.amount);
            const pct = `${pctOf(r.amount)}%`;
            return (
              <View
                key={r.recurrent_budget_id}
                style={i > 0 ? { borderTopWidth: 1, borderTopColor: t.border } : undefined}
              >
                <BudgetRow
                  label={recurrentBudget?.name ?? 'Presupuesto recurrente'}
                  icon={recurrentBudget?.icon_code as IconName | undefined}
                  color={recurrentBudget?.color}
                  value={mode === 'pct' ? pct : money}
                  detail={mode === 'pct' ? money : pct}
                  slider={{
                    value: r.amount,
                    max: income,
                    step: mode === 'pct' ? Math.max(1, Math.round(income / 100)) : AMOUNT_STEP,
                    onChange: (value) => onRowChange(r.recurrent_budget_id, value),
                  }}
                  onRemove={() => onRemoveRow(r.recurrent_budget_id)}
                />
              </View>
            );
          })
        )}
      </Card>

      {/* Recurrent budgets not in the split yet; tapping one adds it. */}
      {recurrentBudgets.length === 0 ? (
        <View className="flex-row items-center gap-3 px-1">
          <Text className="flex-1 text-[13px] font-semi text-muted">
            No se pudieron cargar los presupuestos recurrentes.
          </Text>
          {onRetryRecurrentBudgets ? (
            <Button variant="ghost" icon="swap" onPress={onRetryRecurrentBudgets}>
              Reintentar
            </Button>
          ) : null}
        </View>
      ) : available.length > 0 ? (
        <View className="gap-[9px]">
          <Text className="px-1 pt-1 text-[12px] font-strong uppercase tracking-[0.96px] text-faint">
            Agregar presupuesto recurrente
          </Text>
          <View className="flex-row flex-wrap gap-2 px-0.5">
            {available.map((rb) => (
              <Chip
                key={rb.id}
                label={rb.name}
                icon={rb.icon_code as IconName}
                onPress={() => onAddRow(rb.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default PlanSplitStep;

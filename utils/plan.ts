import type { IconName } from '@/components/ui/Icon';
import { RecurrentBudgetType } from '@/types/RecurrentBudgetType';
import { PlanPeriodType, PlanRowType } from '@/types/PlanType';

/** Presentation of one selectable plan period. */
export interface PlanPeriodOption {
  value: PlanPeriodType;
  label: string;
  /** One-line description shown under the label. */
  sub: string;
  icon: IconName;
  /** Caption for the income captured for this period. */
  incomeLabel: string;
}

/** Periods offered by the plan wizard, in display order. */
export const PLAN_PERIODS: PlanPeriodOption[] = [
  { value: 'monthly', label: 'Mensual', sub: 'Un plan cada mes', icon: 'cal', incomeLabel: 'Ingreso mensual' },
  { value: 'biweekly', label: 'Quincenal', sub: 'Cada dos semanas', icon: 'swap', incomeLabel: 'Ingreso quincenal' },
  { value: 'weekly', label: 'Semanal', sub: 'Un plan cada semana', icon: 'bolt', incomeLabel: 'Ingreso semanal' },
];

/** Returns the presentation of a plan period. */
export const getPlanPeriod = (value: PlanPeriodType): PlanPeriodOption =>
  PLAN_PERIODS.find((p) => p.value === value) ?? PLAN_PERIODS[0];

/** Largest income the wizard accepts. */
export const MAX_PLAN_INCOME = 99_999_999;

/** Suggested split: share of the income (%) per recurrent budget name. Sums to 100. */
export const PLAN_TEMPLATE: { name: string; weight: number }[] = [
  { name: 'Renta', weight: 30 },
  { name: 'Mercado', weight: 18 },
  { name: 'Servicios', weight: 8 },
  { name: 'Transporte', weight: 9 },
  { name: 'Restaurantes', weight: 10 },
  { name: 'Ocio', weight: 8 },
  { name: 'Ahorro', weight: 17 },
];

const normalize = (name: string) => name.trim().toLowerCase();

/** Whether two names match, ignoring case and surrounding spaces. */
export const sameName = (a: string, b: string): boolean => normalize(a) === normalize(b);

/**
 * Builds the suggested split of `income` across the user's recurrent budgets.
 * `PLAN_TEMPLATE` entries are matched to recurrent budgets by name; entries
 * without a match are dropped and the remaining weights rescaled so the whole
 * income is still assigned. Returns no rows when nothing matches.
 *
 * @param income - Amount to split
 * @param recurrentBudgets - Recurrent budgets available to the user
 */
export function suggestSplit(income: number, recurrentBudgets: RecurrentBudgetType[]): PlanRowType[] {
  const matched = PLAN_TEMPLATE.flatMap((entry) => {
    const recurrentBudget = recurrentBudgets.find((r) => sameName(r.name, entry.name));
    return recurrentBudget ? [{ recurrent_budget_id: recurrentBudget.id, weight: entry.weight }] : [];
  });
  const totalWeight = matched.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight === 0) return [];

  const rows = matched.map((m) => ({
    recurrent_budget_id: m.recurrent_budget_id,
    amount: Math.floor((m.weight / totalWeight) * income),
  }));
  // Flooring leaves a few pesos over; the last row absorbs them.
  const assigned = rows.reduce((sum, r) => sum + r.amount, 0);
  rows[rows.length - 1].amount += Math.max(0, income - assigned);
  return rows;
}

/**
 * Limits a row's new amount so the split never exceeds the income.
 *
 * @param rows - Current split
 * @param recurrentBudgetId - Row being changed
 * @param value - Requested amount for that row
 * @param income - Amount being split
 */
export function clampRowAmount(rows: PlanRowType[], recurrentBudgetId: number, value: number, income: number): number {
  const others = rows.reduce((sum, r) => (r.recurrent_budget_id === recurrentBudgetId ? sum : sum + r.amount), 0);
  return Math.max(0, Math.min(value, Math.max(0, income - others)));
}

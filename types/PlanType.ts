import { BudgetPeriodType } from '@/types/BudgetType';

/** Cadences the plan wizard offers (a subset of the budget periods). */
export type PlanPeriodType = Extract<BudgetPeriodType, 'monthly' | 'biweekly' | 'weekly'>;

/** How the split step displays each row: as an amount or as a share of the income. */
export type PlanSplitMode = 'amt' | 'pct';

/** One line of the plan's split: how much of the income a recurrent budget gets. */
export interface PlanRowType {
  recurrent_budget_id: number;
  amount: number;
}

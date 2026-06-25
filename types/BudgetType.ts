export type BudgetPeriodType = 'biweekly' | 'weekly' | 'monthly' | 'yearly';

export interface BudgetType {
  id: number | null;
  name: string;
  max_limit: number; // maximum limit $ for the budget
  expense_amount?: number; // total spent amount, dynamic calculated
  percentage_value: number; // percentage value based on max_limit of account
  start_date?: Date;
  end_date?: Date;
  is_recurrent: boolean; // whether the budget renews automatically each period
  period: BudgetPeriodType; // renewal cadence, only meaningful when is_recurrent is true
}
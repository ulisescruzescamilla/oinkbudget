export interface BudgetType {
  id: number | null;
  name: string;
  max_limit: number; // maximum limit $ for the budget
  expense_amount: number; // total spent amount, dynamic calculated
  percentage_value: number; // percentage value based on max_limit of account
  color: string;
}
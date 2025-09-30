import { BudgetType } from "./BudgetType";

export interface ExpenseType {
  id?: number;
  amount: number;
  description: string;
  date: Date;
  budget: BudgetType;
  // TODO file attached
}
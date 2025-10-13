import { AccountType } from "./AccountType";
import { BudgetType } from "./BudgetType";

export interface ExpenseType {
  id?: number;
  amount: number;
  description: string;
  date: Date;
  budget?: BudgetType;
  budget_id: number;
  account: AccountType;
  account_id: number;
  // TODO file attached
}
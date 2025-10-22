import { AccountType } from "./AccountType";

export interface BudgetType {
  id?: number;
  name: string;
  max_limit: number;
  expense_amount: number; // total spent amount, dynamic calculated
  percentage_value: number; // percentage value based on max_limit of account
  color: string;
}
import { AccountType } from "./AccountType";

export interface ExpenseType {
  id?: number;
  amount: number;
  description: string;
  date: Date;
  budget_id: number;
  account: AccountType;
  account_id: number;
  // TODO file attached
}
import { AccountType } from "./AccountType";

export interface ExpenseType {
  id?: number;
  amount: number;
  description: string;
  date: Date;
  account: AccountType;
  account_id: number;
  // TODO file attached
}
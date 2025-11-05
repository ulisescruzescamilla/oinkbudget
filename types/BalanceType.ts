import { AccountType } from "./AccountType";

export type TypeBalance = 'expense' | 'income'

export interface BalanceType {
  amount: number;
  current_balance: number;
  description: string;
  account_id: number;
  account?: AccountType;
  budget_id: number | null;
  type: TypeBalance;
  created_at: Date;
}
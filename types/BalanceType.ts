import { AccountType } from "./AccountType";

export type TypeBalance = 'expense' | 'income';

export type RangeType = 'today' | 'week' | 'month' | 'all';

export interface BalanceType {
  id: number | null;
  amount: number;
  // current_balance: number | null; // TODO add on backend API
  description: string;
  account_name: string;
  type: TypeBalance;
  account: AccountType | null;
  created_at: Date;
}
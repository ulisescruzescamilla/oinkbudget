import { AccountType } from "./AccountType";

export type TypeBalance = 'expense' | 'income';

export type RangeType = 'today' | 'week' | 'month' | 'all';

export interface BalanceType {
  id: number | null;
  /** Client-generated UUID, set when the record originated (or was edited) offline. Used as the local sync key until `id` is assigned by the server. */
  client_id?: string;
  amount: number;
  // current_balance: number | null; // TODO add on backend API
  description: string;
  account_name: string;
  type: TypeBalance;
  account: AccountType | null;
  created_at: Date;
}
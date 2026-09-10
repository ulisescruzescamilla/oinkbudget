import { AccountType } from "./AccountType";

export interface ExpenseType {
  id: number | null;
  /** Client-generated UUID, set when the record originated (or was edited) offline. Used as the local sync key until `id` is assigned by the server. */
  client_id?: string;
  amount: number;
  description: string;
  created_at: Date;
  budget_id: number;
  account: AccountType;
  account_id: number;
  // TODO file attached
}
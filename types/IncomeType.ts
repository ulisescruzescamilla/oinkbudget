import { AccountType } from "./AccountType";

export interface IncomeType {
  id: number | null;
  /** Client-generated UUID, set when the record originated (or was edited) offline. Used as the local sync key until `id` is assigned by the server. */
  client_id?: string;
  amount: number;
  description: string;
  account: AccountType;
  account_id: number;
  /** Category the movement is classified under; null on movements saved before categories applied to them. */
  category_id?: number | null;
  created_at: Date;
}
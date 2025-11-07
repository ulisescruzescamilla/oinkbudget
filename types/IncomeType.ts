import { AccountType } from "./AccountType";

export interface IncomeType {
  id: number | null;
  amount: number;
  description: string;
  account: AccountType;
  account_id: number;
  created_at: Date;
}
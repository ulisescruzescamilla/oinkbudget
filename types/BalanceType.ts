export type TypeBalance = 'expense' | 'income'

export interface BalanceType {
  id: number | null;
  amount: number;
  current_balance: number;
  description: string;
  account_name: string;
  budget_name: string;
  type: TypeBalance;
  created_at: Date;
}
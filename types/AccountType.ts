export type KindOfAccountType = 'wallet' | 'debit_card' | 'credit_card'

export interface AccountType {
  id: number | null;
  name: string;
  amount: number;
  type: KindOfAccountType;
  hidden: boolean;
}
export type KindOfAccountType = 'cash' | 'debit_card' | 'credit_card'

export interface AccountType {
  id: number | null;
  name: string;
  amount: number;
  type: KindOfAccountType;
  hidden: boolean;
}
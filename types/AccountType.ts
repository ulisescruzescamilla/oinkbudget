export type KindOfAccountType = 'wallet' | 'debit_card' | 'credit_card'

export interface AccountType {
  id?: number;
  name: string;
  amount: number;
  type: KindOfAccountType
}
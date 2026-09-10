export type KindOfAccountType = 'bank' | 'cash' | 'investment' | 'debit_card' | 'credit_card'

export interface AccountType {
  id: number | null;
  /** Client-generated UUID, set when the record originated (or was edited) offline. Used as the local sync key until `id` is assigned by the server. */
  client_id?: string;
  name: string;
  amount: number;
  type: KindOfAccountType;
  hidden: boolean;
}
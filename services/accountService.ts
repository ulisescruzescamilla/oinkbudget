import apiClient from '@/api/client';
import { AccountType, KindOfAccountType } from '@/types/AccountType';

/** Raw shape returned by the API (id is a string). */
type ApiAccount = {
  id: string;
  name: string;
  amount: number;
  type: KindOfAccountType;
  hidden: boolean;
};

/** Fields required to create or update an account. */
export type AccountPayload = Omit<AccountType, 'id'>;

const toAccountType = (a: ApiAccount): AccountType => ({ ...a, id: Number(a.id) });

export const accountService = {
  /**
   * Returns all accounts for the authenticated user.
   */
  async getAll(): Promise<AccountType[]> {
    const { data } = await apiClient.get<ApiAccount[]>('/accounts');
    return data.map(toAccountType);
  },

  /**
   * Returns a single account by id.
   *
   * @param id - Account identifier
   */
  async getById(id: string): Promise<AccountType> {
    const { data } = await apiClient.get<ApiAccount>(`/accounts/${id}`);
    return toAccountType(data);
  },

  /**
   * Creates a new account.
   *
   * @param payload - Account data to create
   */
  async create(payload: AccountPayload): Promise<AccountType> {
    const { data } = await apiClient.post<ApiAccount>('/accounts', payload);
    return toAccountType(data);
  },

  /**
   * Updates an existing account.
   *
   * @param id - Account identifier
   * @param payload - Fields to update
   */
  async update(id: string, payload: Partial<AccountPayload>): Promise<AccountType> {
    const { data } = await apiClient.put<ApiAccount>(`/accounts/${id}`, payload);
    return toAccountType(data);
  },

  /**
   * Deletes an account and its associated records.
   *
   * @param id - Account identifier
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/accounts/${id}`);
  },

  /**
   * Transfers an amount between two accounts.
   *
   * @param fromId - Origin account identifier
   * @param toId - Destination account identifier
   * @param amount - Amount to transfer
   */
  async transfer(fromId: string, toId: string, amount: number): Promise<void> {
    await apiClient.post('/accounts/transfer', { fromId, toId, amount });
  },
};

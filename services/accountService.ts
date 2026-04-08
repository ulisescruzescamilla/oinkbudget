import apiClient from '@/api/client';

export interface Account {
  id: string;
  name: string;
  amount: number;
  type: 'cash' | 'debit_card' | 'credit_card';
  hidden: boolean;
}

export type CreateAccountPayload = Omit<Account, 'id'>;

export const accountService = {
  async getAll(): Promise<Account[]> {
    const { data } = await apiClient.get<Account[]>('/accounts');
    return data;
  },

  async getById(id: string): Promise<Account> {
    const { data } = await apiClient.get<Account>(`/accounts/${id}`);
    return data;
  },

  async create(payload: CreateAccountPayload): Promise<Account> {
    const { data } = await apiClient.post<Account>('/accounts', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateAccountPayload>): Promise<Account> {
    const { data } = await apiClient.put<Account>(`/accounts/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/accounts/${id}`);
  },

  async transfer(fromId: string, toId: string, amount: number): Promise<void> {
    await apiClient.post('/accounts/transfer', { fromId, toId, amount });
  },
};

import apiClient from '@/api/client';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  account_id: string;
  budget_id: string;
  created_at: string;
}

export type CreateExpensePayload = Omit<Expense, 'id' | 'created_at'>;

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    const { data } = await apiClient.get<Expense[]>('/expenses');
    return data;
  },

  async create(payload: CreateExpensePayload): Promise<Expense> {
    const { data } = await apiClient.post<Expense>('/expenses', payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },
};

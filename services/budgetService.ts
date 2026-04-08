import apiClient from '@/api/client';

export interface Budget {
  id: string;
  name: string;
  max_limit: number;
  expense_amount: number;
  percentage_value: number;
  color: string;
}

export type CreateBudgetPayload = Omit<Budget, 'id' | 'expense_amount' | 'percentage_value'>;

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    const { data } = await apiClient.get<Budget[]>('/budgets');
    return data;
  },

  async getById(id: string): Promise<Budget> {
    const { data } = await apiClient.get<Budget>(`/budgets/${id}`);
    return data;
  },

  async create(payload: CreateBudgetPayload): Promise<Budget> {
    const { data } = await apiClient.post<Budget>('/budgets', payload);
    return data;
  },

  async update(id: string, payload: Partial<CreateBudgetPayload>): Promise<Budget> {
    const { data } = await apiClient.patch<Budget>(`/budgets/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/budgets/${id}`);
  },
};

import apiClient from '@/api/client';
import { ExpenseType } from '@/types/ExpenseType';

/** Raw shape returned by the API (id is a string, created_at is a string). */
type ApiExpense = Omit<ExpenseType, 'id' | 'created_at'> & { id: string; created_at: string };

/** Fields required to create an expense. */
export type ExpensePayload = Pick<ExpenseType, 'amount' | 'description' | 'account_id' | 'budget_id'>;

const toExpenseType = (e: ApiExpense): ExpenseType => ({
  ...e,
  id: Number(e.id),
  created_at: new Date(e.created_at),
});

export const expenseService = {
  /**
   * Returns all expenses for the authenticated user.
   */
  async getAll(): Promise<ExpenseType[]> {
    const { data } = await apiClient.get<ApiExpense[]>('/expenses');
    return data.map(toExpenseType);
  },

  /**
   * Creates a new expense.
   *
   * @param payload - Expense data to create
   */
  async create(payload: ExpensePayload): Promise<ExpenseType> {
    const { data } = await apiClient.post<ApiExpense>('/expenses', payload);
    return toExpenseType(data);
  },

  /**
   * Deletes an expense.
   *
   * @param id - Expense identifier
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  },
};

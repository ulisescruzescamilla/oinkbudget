import apiClient from '@/api/client';
import { IncomeType } from '@/types/IncomeType';

/** Raw shape returned by the API (id is a string, created_at is a string). */
type ApiIncome = Omit<IncomeType, 'id' | 'created_at'> & { id: string; created_at: string };

/** Fields required to create an income. */
export type IncomePayload = Pick<IncomeType, 'amount' | 'description' | 'account_id'>;

const toIncomeType = (e: ApiIncome): IncomeType => ({
  ...e,
  id: Number(e.id),
  created_at: new Date(e.created_at),
});

export const incomeService = {
  /**
   * Returns all incomes for the authenticated user.
   */
  async getAll(): Promise<IncomeType[]> {
    const { data } = await apiClient.get<ApiIncome[]>('/incomes');
    return data.map(toIncomeType);
  },

  /**
   * Creates a new income.
   *
   * @param payload - Income data to create
   */
  async create(payload: IncomePayload): Promise<IncomeType> {
    const { data } = await apiClient.post<ApiIncome>('/incomes', payload);
    return toIncomeType(data);
  },

  /**
   * Deletes an income.
   *
   * @param id - Income identifier
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/incomes/${id}`);
  },
};

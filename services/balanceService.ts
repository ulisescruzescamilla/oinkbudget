import apiClient from "@/api/client";
import { BalanceType } from "@/types/BalanceType";

export const balanceService = {
  /**
   * Returns balance data for the authenticated user.
   * @param range  'today' | 'week' | 'month' | 'all'
   * @param type   'all' | 'income' | 'expense'
   */
  async getAll(range?: string, type?: string): Promise<BalanceType[]> {
    const params: Record<string, string> = {};
    if (range && range !== 'all') params.range = range;
    if (type && type !== 'all') params.type = type;
    const { data } = await apiClient.get<BalanceType[]>('/balances', { params });
    return data;
  },
};
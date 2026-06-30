import apiClient from "@/api/client";
import { BalanceType } from "@/types/BalanceType";

export const balanceService = {
  /**
   * Returns balance data for the authenticated user.
   */
  async getAll(): Promise<BalanceType | any> {
    const { data } = await apiClient.get<BalanceType>('/balances');
    console.debug('fetching balance array: ', data);
    return data;
  },
};
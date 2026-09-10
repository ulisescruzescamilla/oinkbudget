import apiClient from '@/api/client';
import { BalanceType } from '@/types/BalanceType';
import { AppError, isNetworkError } from '@/utils/errorHandler';
import { isOnline, recordApiOutcome } from '@/utils/networkStatus';
import * as balanceRepository from '@/database/balanceRepository';

/** Raw shape returned by the API (created_at is a string). */
type ApiBalance = Omit<BalanceType, 'created_at'> & { created_at: string };

const toBalanceType = (b: ApiBalance): BalanceType => ({
  ...b,
  created_at: new Date(b.created_at),
});

export const balanceService = {
  /**
   * Returns balance data for the authenticated user. Falls back to the local
   * transaction-log mirror when offline or the API is unreachable — balances
   * are a read-only byproduct of expense/income creation, not a directly
   * created entity, so there's no separate write path here.
   *
   * @param range  'today' | 'week' | 'month' | 'all'
   * @param type   'all' | 'income' | 'expense'
   */
  async getAll(range?: string, type?: string): Promise<BalanceType[]> {
    if (isOnline()) {
      try {
        const params: Record<string, string> = {};
        if (range && range !== 'all') params.range = range;
        if (type && type !== 'all') params.type = type;
        const { data } = await apiClient.get<ApiBalance[]>('/balances', { params });
        recordApiOutcome(true);
        const balances = data.map(toBalanceType);
        await balanceRepository.replaceAllFromServer(balances);
        return balances;
      } catch (err) {
        if (!isNetworkError(err as AppError)) throw err;
        recordApiOutcome(false);
      }
    }
    return balanceRepository.getAll(range, type);
  },
};

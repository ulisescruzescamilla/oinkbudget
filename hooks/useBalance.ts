import { useState, useEffect, useCallback } from 'react';
import { AppError, FieldErrors } from '@/utils/errorHandler';
import type { BalanceType, RangeType, TypeBalance } from '@/types/BalanceType';
import { balanceService } from '@/services/balanceService';

interface BalanceState {
  balances: BalanceType[] | null;
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}


export function useBalance(range?: RangeType, type?: TypeBalance) {
  const [state, setState] = useState<BalanceState>({
    balances: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches dashboard from the API. */
  const fetchBalance = useCallback(async () => {
    // start loading
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    // fetch data
    try {
      const balances = await balanceService.getAll(range, type);
      setState({ balances, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      // handle error
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, [range, type]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  /**
   * Deletes a movement (and the expense/income behind it).
   *
   * @param balance - The balance row to remove; must carry a server `id`
   * @returns Whether the movement was deleted
   */
  async function removeBalance(balance: BalanceType): Promise<boolean> {
    if (balance.id == null) return false;
    try {
      await balanceService.remove(balance.id);
      setState((s) => ({ ...s, balances: (s.balances ?? []).filter((b) => b.id !== balance.id) }));
      return true;
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, error: err as AppError }));
      return false;
    }
  }

  return {
    ...state,
    refresh: fetchBalance,
    clearFieldErrors,
    removeBalance,
  };
}

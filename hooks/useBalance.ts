import { useState, useEffect, useCallback } from 'react';
import { AppError, FieldErrors } from '@/utils/errorHandler';
import { BalanceType } from '@/types/BalanceType';
import { balanceService } from '@/services/balanceService';

interface BalanceState {
  balances: BalanceType[] | null;
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}


export function useBalance() {
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
      const balances = await balanceService.getAll();
      setState({ balances, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      // handle error
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    refresh: fetchBalance,
    clearFieldErrors,
  };
}

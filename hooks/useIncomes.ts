import { useState, useEffect, useCallback } from 'react';
import { incomeService, IncomePayload } from '@/services/incomeService';
import { IncomeType } from '@/types/IncomeType';
import { AppError, FieldErrors } from '@/utils/errorHandler';

interface IncomesState {
  incomes: IncomeType[];
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}

/**
 * Manages incomes state and exposes CRUD operations backed by the API.
 * Surfaces per-field validation errors from 422 responses in `fieldErrors`.
 */
export function useIncomes() {
  const [state, setState] = useState<IncomesState>({
    incomes: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches all incomes from the API. */
  const fetchIncomes = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const incomes = await incomeService.getAll();
      setState({ incomes, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  /**
   * Creates a new income. Populates `fieldErrors` on 422.
   *
   * @param income - The income data to create
   */
  async function createIncome(income: IncomeType): Promise<IncomeType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const payload: IncomePayload = {
        amount: income.amount,
        description: income.description,
        account_id: income.account_id,
      };
      const created = await incomeService.create(payload);
      setState((s) => ({ ...s, loading: false, incomes: [created, ...s.incomes] }));
      return created;
    } catch (err) {
      const appErr = err as AppError;
      console.error(err);
      setState((s) => ({
        ...s,
        loading: false,
        error: appErr,
        fieldErrors: appErr.fieldErrors ?? null,
      }));
    }
  }

  /**
   * Deletes an income.
   *
   * @param income - The income to remove
   */
  async function removeIncome(income: IncomeType): Promise<void> {
    await incomeService.remove(String(income.id));
    setState((s) => ({ ...s, incomes: s.incomes.filter((e) => e.id !== income.id) }));
  }

  return {
    ...state,
    refresh: fetchIncomes,
    clearFieldErrors,
    createIncome,
    removeIncome,
  };
}

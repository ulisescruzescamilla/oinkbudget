import { useState, useCallback, useEffect } from 'react';
import { recurrentBudgetService, RecurrentBudgetPayload } from '@/services/recurrentBudgetService';
import { RecurrentBudgetType } from '@/types/RecurrentBudgetType';
import { AppError, FieldErrors } from '@/utils/errorHandler';

interface RecurrentBudgetsState {
  recurrentBudgets: RecurrentBudgetType[];
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}

/** Sorts recurrent budgets by name. */
const byName = (a: RecurrentBudgetType, b: RecurrentBudgetType) => a.name.localeCompare(b.name, 'es');

/**
 * Manages recurrent budgets state and exposes CRUD operations backed by the
 * API. Loads on mount; surfaces per-field validation errors from 422
 * responses in `fieldErrors`.
 */
export function useRecurrentBudgets() {
  const [state, setState] = useState<RecurrentBudgetsState>({
    recurrentBudgets: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null, error: null }));
  }, []);

  /** Fetches all recurrent budgets. */
  const fetchRecurrentBudgets = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const recurrentBudgets = (await recurrentBudgetService.getAll()).sort(byName);
      setState({ recurrentBudgets, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => { fetchRecurrentBudgets(); }, [fetchRecurrentBudgets]);

  /**
   * Records a failed mutation in state.
   *
   * @param err - The thrown value (already normalized by the API client)
   */
  const fail = (err: unknown) => {
    const appErr = err as AppError;
    console.error(err);
    setState((s) => ({ ...s, loading: false, error: appErr, fieldErrors: appErr.fieldErrors ?? null }));
  };

  /**
   * Creates a recurrent budget. Populates `fieldErrors` on 422.
   *
   * @param payload - Name, color and icon of the new recurrent budget
   * @returns The created recurrent budget, or undefined on error
   */
  async function createRecurrentBudget(payload: RecurrentBudgetPayload): Promise<RecurrentBudgetType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const created = await recurrentBudgetService.create(payload);
      setState((s) => ({ ...s, loading: false, recurrentBudgets: [...s.recurrentBudgets, created].sort(byName) }));
      return created;
    } catch (err) {
      fail(err);
    }
  }

  /**
   * Updates a recurrent budget. Populates `fieldErrors` on 422.
   *
   * @param recurrentBudget - The recurrent budget with its new values, including its id
   * @returns The updated recurrent budget, or undefined on error
   */
  async function updateRecurrentBudget(recurrentBudget: RecurrentBudgetType): Promise<RecurrentBudgetType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const { id, ...payload } = recurrentBudget;
      const updated = await recurrentBudgetService.update(id, payload);
      setState((s) => ({
        ...s,
        loading: false,
        recurrentBudgets: s.recurrentBudgets.map((r) => (r.id === id ? updated : r)).sort(byName),
      }));
      return updated;
    } catch (err) {
      fail(err);
    }
  }

  /**
   * Deletes a recurrent budget. Populates `error` on failure.
   *
   * @param recurrentBudget - The recurrent budget to remove
   * @returns Whether the delete succeeded
   */
  async function removeRecurrentBudget(recurrentBudget: RecurrentBudgetType): Promise<boolean> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      await recurrentBudgetService.remove(recurrentBudget.id);
      setState((s) => ({
        ...s,
        loading: false,
        recurrentBudgets: s.recurrentBudgets.filter((r) => r.id !== recurrentBudget.id),
      }));
      return true;
    } catch (err) {
      fail(err);
      return false;
    }
  }

  return {
    ...state,
    refresh: fetchRecurrentBudgets,
    clearFieldErrors,
    createRecurrentBudget,
    updateRecurrentBudget,
    removeRecurrentBudget,
  };
}

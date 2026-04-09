import { useState, useCallback, useMemo, useEffect } from 'react';
import { budgetService, BudgetPayload } from '@/services/budgetService';
import { BudgetType } from '@/types/BudgetType';
import { AppError, FieldErrors } from '@/utils/errorHandler';

interface BudgetsState {
  budgets: BudgetType[];
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}

/**
 * Manages budgets state and exposes CRUD operations backed by the API.
 * Surfaces per-field validation errors from 422 responses in `fieldErrors`.
 */
export function useBudgets() {
  const [state, setState] = useState<BudgetsState>({
    budgets: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /**
   * Percentage of income already allocated across all budgets.
   * Used to derive the maximum allowed value for the slider when adding/editing.
   */
  const allocatedPercentage = useMemo(
    () => state.budgets.reduce((sum, b) => sum + b.percentage_value, 0),
    [state.budgets]
  );

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches all budgets from the API. */
  const fetchBudgets = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const budgets = await budgetService.getAll();
      setState({ budgets, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  /**
   * Creates a new budget. Populates `fieldErrors` on 422.
   *
   * @param budget - The budget data to create
   */
  async function createBudget(budget: BudgetType): Promise<BudgetType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const payload: BudgetPayload = {
        name: budget.name,
        graph_color: budget.graph_color,
        start_date: budget.start_date,
        end_date: budget.end_date,
        ...(budget.max_limit > 0
          ? { max_limit: budget.max_limit }
          : { percentage_value: budget.percentage_value }),
      };
      const created = await budgetService.create(payload);
      setState((s) => ({ ...s, loading: false, budgets: [...s.budgets, created] }));
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
   * Updates an existing budget. Populates `fieldErrors` on 422.
   *
   * @param budget - Budget data including its id
   */
  async function updateBudget(budget: BudgetType): Promise<BudgetType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const payload: BudgetPayload = {
        name: budget.name,
        graph_color: budget.graph_color,
        start_date: budget.start_date,
        end_date: budget.end_date,
        ...(budget.max_limit > 0
          ? { max_limit: budget.max_limit }
          : { percentage_value: budget.percentage_value }),
      };
      const updated = await budgetService.update(String(budget.id), payload);
      setState((s) => ({
        ...s,
        loading: false,
        budgets: s.budgets.map((b) => (b.id === budget.id ? updated : b)),
      }));
      return updated;
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
   * Deletes a budget and removes it from local state.
   *
   * @param budget - The budget to remove
   */
  async function removeBudget(budget: BudgetType): Promise<void> {
    await budgetService.remove(String(budget.id));
    setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== budget.id) }));
  }

  return {
    ...state,
    allocatedPercentage,
    refresh: fetchBudgets,
    clearFieldErrors,
    createBudget,
    updateBudget,
    removeBudget,
  };
}

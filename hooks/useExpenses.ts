import { useState, useEffect, useCallback } from 'react';
import { expenseService, ExpensePayload } from '@/services/expenseService';
import { ExpenseType } from '@/types/ExpenseType';
import { BudgetType } from '@/types/BudgetType';
import { AppError, FieldErrors } from '@/utils/errorHandler';

interface ExpensesState {
  expenses: ExpenseType[];
  loading: boolean;
  error: AppError | null;
  /** Per-field validation errors from the last failed mutation (422 response). */
  fieldErrors: FieldErrors | null;
}

/**
 * Manages expenses state and exposes CRUD operations backed by the API.
 * Surfaces per-field validation errors from 422 responses in `fieldErrors`.
 */
export function useExpenses() {
  const [state, setState] = useState<ExpensesState>({
    expenses: [],
    loading: false,
    error: null,
    fieldErrors: null,
  });

  /** Clears field errors. Call when closing the form to reset stale errors. */
  const clearFieldErrors = useCallback(() => {
    setState((s) => ({ ...s, fieldErrors: null }));
  }, []);

  /** Fetches all expenses from the API. */
  const fetchExpenses = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const expenses = await expenseService.getAll();
      setState({ expenses, loading: false, error: null, fieldErrors: null });
    } catch (err) {
      console.error(err);
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  /**
   * Creates a new expense. Populates `fieldErrors` on 422.
   *
   * @param expense - The expense data to create
   * @param budget - The expense's budget, needed to resolve the local sync
   * link when creating offline (an `ExpenseType` only carries `budget_id`, not the full object)
   */
  async function createExpense(expense: ExpenseType, budget?: BudgetType): Promise<ExpenseType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const payload: ExpensePayload = {
        amount: expense.amount,
        description: expense.description,
        account_id: expense.account_id,
        budget_id: expense.budget_id,
        created_at: expense.created_at,
      };
      const created = await expenseService.create(payload, expense.account, budget);
      setState((s) => ({ ...s, loading: false, expenses: [created, ...s.expenses] }));
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
   * Updates an existing (already synced) expense. Populates `fieldErrors` on 422.
   *
   * @param expense - The expense with its new values; must carry a server `id`
   */
  async function updateExpense(expense: ExpenseType): Promise<ExpenseType | undefined> {
    if (expense.id == null) return;
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const updated = await expenseService.update(expense.id, {
        amount: expense.amount,
        description: expense.description,
        account_id: expense.account_id,
        budget_id: expense.budget_id,
      });
      setState((s) => ({
        ...s,
        loading: false,
        expenses: s.expenses.map((e) => (e.id === updated.id ? updated : e)),
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
   * Deletes an expense.
   *
   * @param expense - The expense to remove
   */
  async function removeExpense(expense: ExpenseType): Promise<void> {
    await expenseService.remove(expense.id != null ? String(expense.id) : expense.client_id!);
    setState((s) => ({
      ...s,
      expenses: s.expenses.filter((e) => (expense.id != null ? e.id !== expense.id : e.client_id !== expense.client_id)),
    }));
  }

  return {
    ...state,
    refresh: fetchExpenses,
    clearFieldErrors,
    createExpense,
    updateExpense,
    removeExpense,
  };
}

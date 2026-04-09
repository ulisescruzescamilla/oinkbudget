import { useState, useEffect, useCallback } from 'react';
import { expenseService, ExpensePayload } from '@/services/expenseService';
import { ExpenseType } from '@/types/ExpenseType';
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
   */
  async function createExpense(expense: ExpenseType): Promise<ExpenseType | undefined> {
    setState((s) => ({ ...s, loading: true, error: null, fieldErrors: null }));
    try {
      const payload: ExpensePayload = {
        amount: expense.amount,
        description: expense.description,
        account_id: expense.account_id,
        budget_id: expense.budget_id,
      };
      const created = await expenseService.create(payload);
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
   * Deletes an expense.
   *
   * @param expense - The expense to remove
   */
  async function removeExpense(expense: ExpenseType): Promise<void> {
    await expenseService.remove(String(expense.id));
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== expense.id) }));
  }

  return {
    ...state,
    refresh: fetchExpenses,
    clearFieldErrors,
    createExpense,
    removeExpense,
  };
}

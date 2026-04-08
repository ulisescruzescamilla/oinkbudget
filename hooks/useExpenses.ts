import { useState, useEffect, useCallback } from 'react';
import { expenseService, Expense, CreateExpensePayload } from '@/services/expenseService';
import { AppError } from '@/utils/errorHandler';

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: AppError | null;
}

export function useExpenses() {
  const [state, setState] = useState<ExpensesState>({
    expenses: [],
    loading: false,
    error: null,
  });

  const fetchExpenses = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const expenses = await expenseService.getAll();
      setState({ expenses, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function createExpense(payload: CreateExpensePayload) {
    const expense = await expenseService.create(payload);
    setState((s) => ({ ...s, expenses: [expense, ...s.expenses] }));
    return expense;
  }

  async function removeExpense(id: string) {
    await expenseService.remove(id);
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }

  return { ...state, refresh: fetchExpenses, createExpense, removeExpense };
}

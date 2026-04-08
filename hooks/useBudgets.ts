import { useState, useEffect, useCallback } from 'react';
import { budgetService, Budget, CreateBudgetPayload } from '@/services/budgetService';
import { AppError } from '@/utils/errorHandler';

interface BudgetsState {
  budgets: Budget[];
  loading: boolean;
  error: AppError | null;
}

export function useBudgets() {
  const [state, setState] = useState<BudgetsState>({
    budgets: [],
    loading: false,
    error: null,
  });

  const fetchBudgets = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const budgets = await budgetService.getAll();
      setState({ budgets, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err as AppError }));
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  async function createBudget(payload: CreateBudgetPayload) {
    const budget = await budgetService.create(payload);
    setState((s) => ({ ...s, budgets: [...s.budgets, budget] }));
    return budget;
  }

  async function updateBudget(id: string, payload: Partial<CreateBudgetPayload>) {
    const updated = await budgetService.update(id, payload);
    setState((s) => ({
      ...s,
      budgets: s.budgets.map((b) => (b.id === id ? updated : b)),
    }));
    return updated;
  }

  async function removeBudget(id: string) {
    await budgetService.remove(id);
    setState((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));
  }

  return { ...state, refresh: fetchBudgets, createBudget, updateBudget, removeBudget };
}

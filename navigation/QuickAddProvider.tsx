/**
 * QuickAddProvider — owns the quick-add bottom sheet and exposes an `open(mode)`
 * action to descendants (the FAB in the tab bar and the Dashboard shortcuts).
 *
 * Captured entries are persisted via the API through `useExpenses` / `useIncomes`.
 * A `version` counter is bumped after each save so data screens can reload.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QuickAddEntry, QuickAddSheet } from '@/components/features';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncomes } from '@/hooks/useIncomes';
import { TypeBalance } from '@/types/BalanceType';
import { ExpenseType } from '@/types/ExpenseType';
import { IncomeType } from '@/types/IncomeType';

interface QuickAddContextValue {
  /** Opens the quick-add sheet in the given mode (defaults to expense). */
  open: (mode?: TypeBalance) => void;
  /** Increments after every successful save; use as a refresh signal. */
  version: number;
}

const QuickAddContext = createContext<QuickAddContextValue>({ open: () => { }, version: 0 });

/** Hook to access the quick-add controls. */
export const useQuickAdd = () => useContext(QuickAddContext);

/** Provides the quick-add sheet + open action to the tab tree. */
export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const { budgets, refresh: refreshBudgets } = useBudgets();
  const {
    createExpense,
    fieldErrors: expenseFieldErrors,
    clearFieldErrors: clearExpenseFieldErrors,
  } = useExpenses();
  const {
    createIncome,
    fieldErrors: incomeFieldErrors,
    clearFieldErrors: clearIncomeFieldErrors,
  } = useIncomes();

  const [isOpen, setOpen] = useState(false);
  const [mode, setMode] = useState<TypeBalance>('expense');
  const [version, setVersion] = useState(0);
  const [lastType, setLastType] = useState<TypeBalance>('expense');

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const open = useCallback((m: TypeBalance = 'expense') => {
    setMode(m);
    setOpen(true);
  }, []);

  const clearServerFieldErrors = useCallback(() => {
    clearExpenseFieldErrors();
    clearIncomeFieldErrors();
  }, [clearExpenseFieldErrors, clearIncomeFieldErrors]);

  const handleSubmit = useCallback(
    async (entry: QuickAddEntry): Promise<boolean> => {
      setLastType(entry.type);
      if (entry.type === 'expense') {
        const expense: ExpenseType = {
          id: null,
          amount: entry.amount,
          description: entry.description,
          created_at: new Date(),
          budget_id: entry.budget?.id ?? 0,
          account: entry.account,
          account_id: entry.account.id!,
        };
        const created = await createExpense(expense);
        if (!created) return false;
      } else {
        const income: IncomeType = {
          id: null,
          amount: entry.amount,
          description: entry.description,
          account: entry.account,
          account_id: entry.account.id!,
          created_at: new Date(),
        };
        const created = await createIncome(income);
        if (!created) return false;
      }
      setVersion((v) => v + 1);
      await Promise.all([refreshAccounts(), refreshBudgets()]);
      return true;
    },
    [refreshAccounts, refreshBudgets, createExpense, createIncome]
  );

  const value = useMemo(() => ({ open, version }), [open, version]);
  const serverFieldErrors = lastType === 'income' ? incomeFieldErrors : expenseFieldErrors;

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddSheet
        open={isOpen}
        mode={mode}
        onClose={() => setOpen(false)}
        accounts={accounts}
        budgets={budgets}
        onSubmit={handleSubmit}
        serverFieldErrors={serverFieldErrors}
        onClearServerFieldErrors={clearServerFieldErrors}
      />
    </QuickAddContext.Provider>
  );
}

export default QuickAddProvider;

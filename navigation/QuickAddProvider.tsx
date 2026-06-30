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
  const { createExpense } = useExpenses();
  const { createIncome } = useIncomes();

  const [isOpen, setOpen] = useState(false);
  const [mode, setMode] = useState<TypeBalance>('expense');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const open = useCallback((m: TypeBalance = 'expense') => {
    setMode(m);
    setOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (entry: QuickAddEntry) => {
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
        await createExpense(expense);
      } else {
        const income: IncomeType = {
          id: null,
          amount: entry.amount,
          description: entry.description,
          account: entry.account,
          account_id: entry.account.id!,
          created_at: new Date(),
        };
        await createIncome(income);
      }
      setVersion((v) => v + 1);
      await Promise.all([refreshAccounts(), refreshBudgets()]);
    },
    [refreshAccounts, refreshBudgets, createExpense, createIncome]
  );

  const value = useMemo(() => ({ open, version }), [open, version]);

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
      />
    </QuickAddContext.Provider>
  );
}

export default QuickAddProvider;

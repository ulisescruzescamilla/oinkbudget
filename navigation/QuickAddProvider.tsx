/**
 * QuickAddProvider — owns the quick-add bottom sheet and exposes an `open(mode)`
 * action to descendants (the FAB in the tab bar and the Dashboard shortcuts).
 *
 * Captured entries are written to the local balances log via `insertToBalance`,
 * which also updates the account balance and (for expenses) the budget. A `version`
 * counter is bumped after each save so data screens can reload.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QuickAddEntry, QuickAddSheet } from '@/components/features';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { insertToBalance } from '@/database/balanceRepository';
import { BalanceType, TypeBalance } from '@/types/BalanceType';

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
      const balance: BalanceType = {
        id: null,
        amount: entry.amount,
        current_balance:
          entry.type === 'income'
            ? entry.account.amount + entry.amount
            : entry.account.amount - entry.amount,
        description: entry.description,
        account_name: entry.account.name,
        budget_name: entry.budget?.name ?? '',
        type: entry.type,
        created_at: new Date(),
      };
      await insertToBalance(
        balance,
        entry.account,
        entry.budget ? { ...entry.budget, expense_amount: entry.budget.expense_amount ?? 0 } : undefined
      );
      setVersion((v) => v + 1);
      await Promise.all([refreshAccounts(), refreshBudgets()]);
    },
    [refreshAccounts, refreshBudgets]
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
